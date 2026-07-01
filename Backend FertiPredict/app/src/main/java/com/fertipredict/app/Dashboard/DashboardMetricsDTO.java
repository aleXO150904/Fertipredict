package com.fertipredict.app.Dashboard;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardMetricsDTO {
    private long predictionsThisMonth;
    private long totalCouples;
    private double modelAccuracy;
    private long detectedCases;
    private double predictionsChange;
    private double couplesChange;
    private double accuracyChange;
    private double detectedChange;
}