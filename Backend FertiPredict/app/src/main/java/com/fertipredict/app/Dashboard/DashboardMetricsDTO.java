package com.fertipredict.app.Dashboard;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardMetricsDTO {
    private long predictionsInPeriod;
    private long totalCouples;
    private double highRiskPercentage;
    private long detectedCases;
    private Double predictionsChange;
    private Double couplesChange;
    private Double detectedChange;
}