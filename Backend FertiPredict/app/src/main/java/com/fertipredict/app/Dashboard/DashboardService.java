package com.fertipredict.app.Dashboard;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fertipredict.app.Couple.CoupleRepository;
import com.fertipredict.app.Prediction.Prediction;
import com.fertipredict.app.Prediction.PredictionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PredictionRepository predictionRepository;
    private final com.fertipredict.app.User.CurrentUser currentUser;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ── Mapeo feature → categoría agrupada ─────────────────
    private static final Map<String, String> FEATURE_CATEGORY_MAP = new HashMap<>();
    static {
        // Edad
        FEATURE_CATEGORY_MAP.put("Edad_Masculino", "Edad");
        FEATURE_CATEGORY_MAP.put("Edad_Femenino", "Edad");

        // Factor Masculino
        FEATURE_CATEGORY_MAP.put("Concentracion_Esperma", "Factor Masculino");
        FEATURE_CATEGORY_MAP.put("Motilidad_Espermatica", "Factor Masculino");
        FEATURE_CATEGORY_MAP.put("Morfologia_Espermatica", "Factor Masculino");
        FEATURE_CATEGORY_MAP.put("Varicocele", "Factor Masculino");

        // Factor Femenino
        FEATURE_CATEGORY_MAP.put("Hormona_AMH", "Factor Femenino");
        FEATURE_CATEGORY_MAP.put("Hormona_Antimulleriana_(amh)", "Factor Femenino");
        FEATURE_CATEGORY_MAP.put("hormona_foliculoestimulante_(fsh)", "Factor Femenino");
        FEATURE_CATEGORY_MAP.put("Hormona_FSH", "Factor Femenino");
        FEATURE_CATEGORY_MAP.put("Ciclo_Menstrual", "Factor Femenino");
        FEATURE_CATEGORY_MAP.put("PCOS", "Factor Femenino");
        FEATURE_CATEGORY_MAP.put("Endometriosis", "Factor Femenino");
        FEATURE_CATEGORY_MAP.put("Obstruccion_Tubaria", "Factor Femenino");
        FEATURE_CATEGORY_MAP.put("Abortos_Previos", "Factor Femenino");

        // Estilo de Vida
        FEATURE_CATEGORY_MAP.put("IMC_Masculino", "Estilo de Vida");
        FEATURE_CATEGORY_MAP.put("IMC_Femenino", "Estilo de Vida");
        FEATURE_CATEGORY_MAP.put("Fumador_Masculino", "Estilo de Vida");
        FEATURE_CATEGORY_MAP.put("Fumador_Femenino", "Estilo de Vida");
        FEATURE_CATEGORY_MAP.put("Consumo_Alcohol_Masculino", "Estilo de Vida");
        FEATURE_CATEGORY_MAP.put("Consumo_Alcohol_Femenino", "Estilo de Vida");
        FEATURE_CATEGORY_MAP.put("Nivel_Ejercicio_Masculino", "Estilo de Vida");
        FEATURE_CATEGORY_MAP.put("Nivel_Ejercicio_Femenino", "Estilo de Vida");
        FEATURE_CATEGORY_MAP.put("Tipo_Alimentacion_Masculino", "Estilo de Vida");
        FEATURE_CATEGORY_MAP.put("Tipo_Alimentacion_Femenino", "Estilo de Vida");

        // Antecedentes Familiares
        FEATURE_CATEGORY_MAP.put("Historial_Familiar_Infertilidad_Masculino", "Antecedentes Familiares");
        FEATURE_CATEGORY_MAP.put("Historial_Familiar_Infertilidad_Femenino", "Antecedentes Familiares");

        // Exposición Ambiental
        FEATURE_CATEGORY_MAP.put("Exposicion_Toxicos_Calor_Masculino", "Exposición Ambiental");
    }

    private List<Prediction> predictions(DateRange range) {
        var user = currentUser.get();
        if (user.getRole() != com.fertipredict.app.User.Role.ADMIN)
            return predictionRepository.findByUser_IdAndDateGreaterThanEqualAndDateLessThan(user.getId(), range.start().atStartOfDay(), range.end().plusDays(1).atStartOfDay());
        return predictionRepository.findByDateGreaterThanEqualAndDateLessThan(
            range.start().atStartOfDay(), range.end().plusDays(1).atStartOfDay());
    }
    private long couples(List<Prediction> predictions) {
        return predictions.stream().map(p -> p.getCouple().getId()).distinct().count();
    }
    private long high(List<Prediction> predictions) {
        return predictions.stream().filter(p -> "HIGH".equalsIgnoreCase(p.getRiskLevel())).count();
    }

    public DashboardMetricsDTO getMetrics(DateRange range) {
        var current = predictions(range);
        var previous = predictions(range.previous());
        return DashboardMetricsDTO.builder()
            .predictionsInPeriod(current.size()).totalCouples(couples(current)).detectedCases(high(current))
            .highRiskPercentage(current.isEmpty() ? 0 : round1(100.0 * high(current) / current.size()))
            .predictionsChange(percentChange(previous.size(), current.size()))
            .couplesChange(percentChange(couples(previous), couples(current)))
            .detectedChange(percentChange(high(previous), high(current))).build();
    }

    public List<MonthlyTrendDTO> getMonthlyTrend(DateRange range) {
        var all = predictions(range);
        var grouped = all.stream().collect(Collectors.groupingBy(p -> YearMonth.from(p.getDate())));
        var result = new ArrayList<MonthlyTrendDTO>();
        for (var month = YearMonth.from(range.start()); !month.isAfter(YearMonth.from(range.end())); month = month.plusMonths(1)) {
            var rows = grouped.getOrDefault(month, List.of());
            result.add(MonthlyTrendDTO.builder().month(month.toString())
                .predictions(rows.size()).detections(high(rows)).build());
        }
        return result;
    }

    // ── 3. Distribución de factores (REAL, basado en SHAP) ─
    public List<FactorItemDTO> getFactorDistribution(DateRange range) {
        List<Prediction> all = predictions(range);

        // Acumular |SHAP| promedio por categoría agrupada
        Map<String, Double> categorySum = new HashMap<>();
        Map<String, Integer> categoryCount = new HashMap<>();

        for (Prediction p : all) {
            String json = p.getExplanation();
            if (json == null || json.isBlank()) continue;

            try {
                Map<String, Double> shapValues = objectMapper.readValue(
                        json, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Double>>() {}
                );

                for (Map.Entry<String, Double> entry : shapValues.entrySet()) {
                    String category = FEATURE_CATEGORY_MAP.getOrDefault(entry.getKey(), "Otros");
                    if (entry.getValue() == null || !Double.isFinite(entry.getValue())) continue;
                    double absValue = Math.abs(entry.getValue());

                    categorySum.merge(category, absValue, Double::sum);
                    categoryCount.merge(category, 1, Integer::sum);
                }
            } catch (Exception e) {
                // JSON malformado o nulo: se ignora esa predicción
                continue;
            }
        }

        if (categorySum.isEmpty()) return List.of();

        // Promedio por categoría
        Map<String, Double> categoryAvg = new HashMap<>();
        for (String cat : categorySum.keySet()) {
            categoryAvg.put(cat, categorySum.get(cat) / categoryCount.get(cat));
        }

        // Normalizar a porcentajes que sumen 100
        double totalAvg = categoryAvg.values().stream().mapToDouble(Double::doubleValue).sum();

        if (totalAvg == 0) return List.of();

        List<Map.Entry<String, Double>> sorted = categoryAvg.entrySet().stream()
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .collect(Collectors.toList());

        // Top 5, resto agrupado en "Otros"
        List<FactorItemDTO> result = new ArrayList<>();
        double othersSum = 0;

        for (int i = 0; i < sorted.size(); i++) {
            Map.Entry<String, Double> entry = sorted.get(i);
            double pct = (entry.getValue() / totalAvg) * 100;

            if (i < 5) {
                result.add(FactorItemDTO.builder()
                        .factor(entry.getKey())
                        .percentage(round1(pct))
                        .build());
            } else {
                othersSum += pct;
            }
        }

        if (othersSum > 0) {
            result.add(FactorItemDTO.builder()
                    .factor("Otros")
                    .percentage(round1(othersSum))
                    .build());
        }

        return result;
    }

    // ── 4. Categorización por nivel de riesgo ──────────────
    public RiskDistributionDTO getRiskDistribution(DateRange range) {
        List<Prediction> all = predictions(range);

        Map<String, Long> counts = all.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getRiskLevel().toUpperCase(),
                        Collectors.counting()
                ));

        return RiskDistributionDTO.builder()
                .low(counts.getOrDefault("LOW", 0L))
                .moderate(counts.getOrDefault("MODERATE", 0L))
                .high(counts.getOrDefault("HIGH", 0L))
                .build();
    }

    // ── Helpers ─────────────────────────────────────────────
    private Double percentChange(long previous, long current) {
        if (previous == 0) return current == 0 ? 0.0 : null;
        return round1(((double) (current - previous) / previous) * 100.0);
    }

    private double round1(double value) {
        return Math.round(value * 10) / 10.0;
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }
}