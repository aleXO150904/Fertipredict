package com.fertipredict.app.Dashboard;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FactorItemDTO {
    private String factor;
    private double percentage;
}
