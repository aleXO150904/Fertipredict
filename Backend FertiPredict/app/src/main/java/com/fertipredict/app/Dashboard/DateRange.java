package com.fertipredict.app.Dashboard;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public record DateRange(LocalDate start, LocalDate end) {
    public DateRange {
        if (start == null || end == null || start.isAfter(end)
                || ChronoUnit.DAYS.between(start, end) > 3660
                || end.isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un intervalo válido de hasta diez años, sin fechas futuras.");
        }
    }
    public static DateRange of(LocalDate start, LocalDate end) {
        LocalDate last = end == null ? LocalDate.now() : end;
        return new DateRange(start == null ? last.minusMonths(5).withDayOfMonth(1) : start, last);
    }
    public DateRange previous() {
        long days = ChronoUnit.DAYS.between(start, end) + 1;
        return new DateRange(start.minusDays(days), start.minusDays(1));
    }
}
