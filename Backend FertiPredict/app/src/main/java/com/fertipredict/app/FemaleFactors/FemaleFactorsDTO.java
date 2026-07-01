package com.fertipredict.app.FemaleFactors;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FemaleFactorsDTO {
    Long id;
    Boolean pcos;
    Boolean periodRegularity;
    Integer previousAbortions;
    Boolean endometriosis;
    Float amh;
    Float fsh;
    Boolean tubalObstruction;
    Boolean familyInfertilityHistory;
}