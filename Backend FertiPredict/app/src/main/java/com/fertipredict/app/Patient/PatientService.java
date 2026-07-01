package com.fertipredict.app.Patient;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.fertipredict.app.Couple.Couple;
import com.fertipredict.app.FemaleFactors.FemaleFactors;
import com.fertipredict.app.FemaleFactors.FemaleFactorsDTO;
import com.fertipredict.app.FemaleFactors.FemaleFactorsRepository;
import com.fertipredict.app.MaleFactors.MaleFactors;
import com.fertipredict.app.MaleFactors.MaleFactorsDTO;
import com.fertipredict.app.MaleFactors.MaleFactorsRepository;

import jakarta.transaction.Transactional;

@Service
@RequiredArgsConstructor
public class PatientService {
    private final PatientRepository patientRepository;
    private final MaleFactorsRepository maleFactorsRepository;
    private final FemaleFactorsRepository femaleFactorsRepository;

    @Transactional
    public Patient createPatient(PatientDTO patientDTO, Couple couple) {
        Patient patient = Patient.builder()
            .fullName(patientDTO.getFullName())
            .age(patientDTO.getAge())
            .sex(patientDTO.getSex())
            .email(patientDTO.getEmail())
            .phone(patientDTO.getPhone())
            .imc(patientDTO.getImc())
            .smoker(patientDTO.getSmoker())
            .exerciseLevel(patientDTO.getExerciseLevel())
            .alcoholConsumption(patientDTO.getAlcoholConsumption())
            .dietType(patientDTO.getDietType())
            .couple(couple)
            .build();
        return patientRepository.save(patient);
    }

    @Transactional
    public void createMaleFactors(MaleFactorsDTO maleFactorsDTO, Couple couple) {
        MaleFactors maleFactors = MaleFactors.builder()
            .spermCountMPerMl(maleFactorsDTO.getSpermCountMPerMl())
            .spermMotilityPct(maleFactorsDTO.getSpermMotilityPct())
            .spermMorphologyPct(maleFactorsDTO.getSpermMorphologyPct())
            .varicocele(maleFactorsDTO.getVaricocele())
            .heatToxicExposure(maleFactorsDTO.getHeatToxicExposure())
            .familyInfertilityHistory(maleFactorsDTO.getFamilyInfertilityHistory())
            .couple(couple)
            .build();
        maleFactorsRepository.save(maleFactors);
    }

    @Transactional
    public void createFemaleFactors(FemaleFactorsDTO femaleFactorsDTO, Couple couple) {
        FemaleFactors femaleFactors = FemaleFactors.builder()
            .pcos(femaleFactorsDTO.getPcos())
            .periodRegularity(femaleFactorsDTO.getPeriodRegularity())
            .previousAbortions(femaleFactorsDTO.getPreviousAbortions())
            .endometriosis(femaleFactorsDTO.getEndometriosis())
            .amh(femaleFactorsDTO.getAmh())
            .fsh(femaleFactorsDTO.getFsh())
            .tubalObstruction(femaleFactorsDTO.getTubalObstruction())
            .familyInfertilityHistory(femaleFactorsDTO.getFamilyInfertilityHistory())
            .couple(couple)
            .build();
        femaleFactorsRepository.save(femaleFactors);
    }

    public PatientDTO toDTO(Patient patient, MaleFactorsDTO maleFactorsDTO, FemaleFactorsDTO femaleFactorsDTO) {
        return PatientDTO.builder()
            .id(patient.getId())
            .fullName(patient.getFullName())
            .age(patient.getAge())
            .sex(patient.getSex())
            .email(patient.getEmail())
            .phone(patient.getPhone())
            .imc(patient.getImc())
            .smoker(patient.getSmoker())
            .exerciseLevel(patient.getExerciseLevel())
            .alcoholConsumption(patient.getAlcoholConsumption())
            .dietType(patient.getDietType())
            .maleFactors(maleFactorsDTO)
            .femaleFactors(femaleFactorsDTO)
            .build();
    }

    @Transactional
    public void updatePatient(PatientDTO patientDTO, Patient patient) {
        patient.setFullName(patientDTO.getFullName());
        patient.setAge(patientDTO.getAge());
        patient.setEmail(patientDTO.getEmail());
        patient.setPhone(patientDTO.getPhone());
        patient.setImc(patientDTO.getImc());
        patient.setSmoker(patientDTO.getSmoker());
        patient.setExerciseLevel(patientDTO.getExerciseLevel());
        patient.setAlcoholConsumption(patientDTO.getAlcoholConsumption());
        patient.setDietType(patientDTO.getDietType());
        patientRepository.save(patient);
    }

    @Transactional
    public void updateMaleFactors(MaleFactorsDTO maleFactorsDTO, Couple couple) {
        if (couple.getMaleFactors().isEmpty()) {
            createMaleFactors(maleFactorsDTO, couple);
            return;
        }
        MaleFactors mf = couple.getMaleFactors().get(0);
        mf.setSpermCountMPerMl(maleFactorsDTO.getSpermCountMPerMl());
        mf.setSpermMotilityPct(maleFactorsDTO.getSpermMotilityPct());
        mf.setSpermMorphologyPct(maleFactorsDTO.getSpermMorphologyPct());
        mf.setVaricocele(maleFactorsDTO.getVaricocele());
        mf.setHeatToxicExposure(maleFactorsDTO.getHeatToxicExposure());
        mf.setFamilyInfertilityHistory(maleFactorsDTO.getFamilyInfertilityHistory());
        maleFactorsRepository.save(mf);
    }

    @Transactional
    public void updateFemaleFactors(FemaleFactorsDTO femaleFactorsDTO, Couple couple) {
        if (couple.getFemaleFactors().isEmpty()) {
            createFemaleFactors(femaleFactorsDTO, couple);
            return;
        }
        FemaleFactors ff = couple.getFemaleFactors().get(0);
        ff.setPcos(femaleFactorsDTO.getPcos());
        ff.setPeriodRegularity(femaleFactorsDTO.getPeriodRegularity());
        ff.setPreviousAbortions(femaleFactorsDTO.getPreviousAbortions());
        ff.setEndometriosis(femaleFactorsDTO.getEndometriosis());
        ff.setAmh(femaleFactorsDTO.getAmh());
        ff.setFsh(femaleFactorsDTO.getFsh());
        ff.setTubalObstruction(femaleFactorsDTO.getTubalObstruction());
        ff.setFamilyInfertilityHistory(femaleFactorsDTO.getFamilyInfertilityHistory());
        femaleFactorsRepository.save(ff);
    }
}