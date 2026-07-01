package com.fertipredict.app.Dashboard;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskDistributionDTO {
    private long low;
    private long moderate;
    private long high;
}