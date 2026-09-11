package com.fertipredict.app.Dashboard;

import com.fertipredict.app.Prediction.*;
import com.fertipredict.app.Couple.Couple;
import java.time.*;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.springframework.web.server.ResponseStatusException;

class DashboardServiceTest {
    PredictionRepository repository = mock(PredictionRepository.class);
    DashboardService service = new DashboardService(repository);
    DateRange range = new DateRange(LocalDate.of(2025, 12, 31), LocalDate.of(2026, 1, 2));
    Prediction prediction(String date, String risk, String explanation) {
        Couple couple = new Couple(); couple.setId(1L);
        return Prediction.builder().date(LocalDateTime.parse(date)).riskLevel(risk).couple(couple).explanation(explanation).build();
    }
    void rows(List<Prediction> rows) {
        when(repository.findByDateGreaterThanEqualAndDateLessThan(any(), any())).thenAnswer(call -> {
            LocalDateTime start = call.getArgument(0), end = call.getArgument(1);
            return rows.stream().filter(p -> !p.getDate().isBefore(start) && p.getDate().isBefore(end)).toList();
        });
    }
    @Test void inclusiveDatesAndMatchingMetricsAcrossYearBoundary() {
        rows(List.of(prediction("2025-12-31T00:00:00", "LOW", null), prediction("2026-01-02T23:59:59", "HIGH", null),
            prediction("2026-01-03T00:00:00", "HIGH", null)));
        var metrics = service.getMetrics(range);
        assertEquals(2, metrics.getPredictionsInPeriod());
        assertEquals(1, metrics.getTotalCouples());
        assertEquals(50, metrics.getHighRiskPercentage());
        assertNull(metrics.getPredictionsChange());
        var trend = service.getMonthlyTrend(range);
        assertEquals(List.of("2025-12", "2026-01"), trend.stream().map(MonthlyTrendDTO::getMonth).toList());
        assertEquals(2, trend.stream().mapToLong(MonthlyTrendDTO::getPredictions).sum());
        var risk = service.getRiskDistribution(range);
        assertEquals(1, risk.getLow()); assertEquals(1, risk.getHigh());
        verify(repository, atLeastOnce()).findByDateGreaterThanEqualAndDateLessThan(range.start().atStartOfDay(), LocalDate.of(2026, 1, 3).atStartOfDay());
    }
    @Test void emptyOrZeroShapDoesNotInventFactors() {
        rows(List.of());
        assertEquals(0, service.getMetrics(range).getPredictionsInPeriod());
        assertTrue(service.getFactorDistribution(range).isEmpty());
        rows(List.of(prediction("2026-01-01T12:00:00", "LOW", "{\"Edad_Masculino\":0}")));
        assertTrue(service.getFactorDistribution(range).isEmpty());
    }
    @Test void previousPeriodHasSameNumberOfDaysAndNegativeChangeIsCorrect() {
        assertEquals(LocalDate.of(2025, 12, 28), range.previous().start());
        assertEquals(LocalDate.of(2025, 12, 30), range.previous().end());
        rows(List.of(prediction("2025-12-28T12:00:00", "LOW", null), prediction("2025-12-30T12:00:00", "LOW", null), prediction("2026-01-01T12:00:00", "LOW", null)));
        assertEquals(-50.0, service.getMetrics(range).getPredictionsChange());
    }
    @Test void invalidRangesAreRejected() {
        assertThrows(ResponseStatusException.class, () -> new DateRange(range.end(), range.start()));
        assertThrows(ResponseStatusException.class, () -> new DateRange(LocalDate.now(), LocalDate.now().plusDays(1)));
        assertThrows(ResponseStatusException.class, () -> new DateRange(LocalDate.of(2000, 1, 1), LocalDate.now()));
    }
}
