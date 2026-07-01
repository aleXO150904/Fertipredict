package com.fertipredict.app.Prediction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.Map;

import com.fertipredict.app.Couple.CoupleDTO;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionDTO {
    Long id;
    String riskLevel;
    Float probability;
    Map<String, Double> explanation;
    LocalDateTime date;
    CoupleDTO couple;
}