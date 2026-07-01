package com.fertipredict.app.MaleFactors;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaleFactorsDTO {
    Long id;
    Integer spermCountMPerMl;
    Integer spermMotilityPct;
    Float spermMorphologyPct;
    Boolean varicocele;
    Boolean heatToxicExposure;
    Boolean familyInfertilityHistory;
}