package com.fertipredict.app.Dashboard;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/metrics")
    public DashboardMetricsDTO getMetrics() {
        return dashboardService.getMetrics();
    }

    @GetMapping("/monthly-trend")
    public List<MonthlyTrendDTO> getMonthlyTrend() {
        return dashboardService.getMonthlyTrend();
    }

    @GetMapping("/factor-distribution")
    public List<FactorItemDTO> getFactorDistribution() {
        return dashboardService.getFactorDistribution();
    }

    @GetMapping("/risk-distribution")
    public RiskDistributionDTO getRiskDistribution() {
        return dashboardService.getRiskDistribution();
    }
}
