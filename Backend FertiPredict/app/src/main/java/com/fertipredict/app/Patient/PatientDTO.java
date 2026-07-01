package com.fertipredict.app.Patient;

import com.fertipredict.app.FemaleFactors.FemaleFactorsDTO;
import com.fertipredict.app.MaleFactors.MaleFactorsDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientDTO {
    Long id;
    String fullName;
    Integer age;
    Character sex;
    String email;
    String phone;
    Float imc;
    Boolean smoker;
    Integer exerciseLevel;
    Integer alcoholConsumption;
    Integer dietType;
    MaleFactorsDTO maleFactors;
    FemaleFactorsDTO femaleFactors;
}