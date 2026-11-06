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
    Long userId;
    String createdBy;
    String riskLevel;
    Float probability;
    Map<String, Double> explanation;
    String date;
    java.time.Instant createdAt;
    java.time.Instant updatedAt;
    String dateTimeZone;
    CoupleDTO couple;
}