package com.fertipredict.app.MLClient;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MLPredictionResponse {
    String riskLevel;
    Float probability;
    Map<String, Double> explanation;
}
 