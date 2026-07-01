package com.fertipredict.app.Couple;

import com.fertipredict.app.Patient.PatientDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoupleDTO {
    Long id;
    PatientDTO malePatient;
    PatientDTO femalePatient;
}
