package com.fertipredict.app.Prediction;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fertipredict.app.Couple.Couple;
import com.fertipredict.app.Couple.CoupleDTO;
import com.fertipredict.app.Couple.CoupleRepository;
import com.fertipredict.app.FemaleFactors.FemaleFactorsDTO;
import com.fertipredict.app.MLClient.MLClientService;
import com.fertipredict.app.MLClient.MLPredictionRequest;
import com.fertipredict.app.MLClient.MLPredictionResponse;
import com.fertipredict.app.MaleFactors.MaleFactorsDTO;
import com.fertipredict.app.Patient.Patient;
import com.fertipredict.app.Patient.PatientDTO;
import com.fertipredict.app.Patient.PatientService;
import com.fertipredict.app.User.User;
import com.fertipredict.app.User.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PredictionService {
    private final PredictionRepository predictionRepository;
    private final CoupleRepository coupleRepository;
    private final PatientService patientService;
    private final UserRepository userRepository;
    private final MLClientService mlClientService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public PredictionDTO createPrediction(PredictionDTO predictionDTO) {
        // Obtener usuario autenticado desde el contexto de seguridad
        String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByUsername(username).orElseThrow();

        // Crear la pareja primero
        Couple couple = coupleRepository.save(new Couple());

        PatientDTO malePatientDTO = predictionDTO.getCouple().getMalePatient();
        PatientDTO femalePatientDTO = predictionDTO.getCouple().getFemalePatient();
        MaleFactorsDTO maleFactorsDTO = malePatientDTO.getMaleFactors();
        FemaleFactorsDTO femaleFactorsDTO = femalePatientDTO.getFemaleFactors();

        // Crear pacientes y factores asociados a la pareja
        Patient malePatient = patientService.createPatient(malePatientDTO, couple);
        Patient femalePatient = patientService.createPatient(femalePatientDTO, couple);
        patientService.createMaleFactors(maleFactorsDTO, couple);
        patientService.createFemaleFactors(femaleFactorsDTO, couple);

        // Construir el request hacia la API del modelo ML
        MLPredictionRequest mlRequest = MLPredictionRequest.builder()
            // Masculino
            .Edad_Masculino(malePatientDTO.getAge())
            .IMC_Masculino(malePatientDTO.getImc())
            .Concentracion_Esperma(maleFactorsDTO.getSpermCountMPerMl())
            .Motilidad_Espermatica(maleFactorsDTO.getSpermMotilityPct())
            .Morfologia_Espermatica(maleFactorsDTO.getSpermMorphologyPct())
            .Varicocele(boolToInt(maleFactorsDTO.getVaricocele()))
            .Exposicion_Toxicos_Calor_Masculino(boolToInt(maleFactorsDTO.getHeatToxicExposure()))
            .Fumador_Masculino(boolToInt(malePatientDTO.getSmoker()))
            .Consumo_Alcohol_Masculino(malePatientDTO.getAlcoholConsumption())
            .Nivel_Ejercicio_Masculino(malePatientDTO.getExerciseLevel())
            .Tipo_Alimentacion_Masculino(malePatientDTO.getDietType())
            .Historial_Familiar_Infertilidad_Masculino(boolToInt(maleFactorsDTO.getFamilyInfertilityHistory()))
            // Femenino
            .Edad_Femenino(femalePatientDTO.getAge())
            .IMC_Femenino(femalePatientDTO.getImc())
            .Ciclo_Menstrual(boolToInt(femaleFactorsDTO.getPeriodRegularity()))
            .PCOS(boolToInt(femaleFactorsDTO.getPcos()))
            .Endometriosis(boolToInt(femaleFactorsDTO.getEndometriosis()))
            .Hormona_AMH(femaleFactorsDTO.getAmh())
            .Hormona_FSH(femaleFactorsDTO.getFsh())
            .Obstruccion_Tubaria(boolToInt(femaleFactorsDTO.getTubalObstruction()))
            .Abortos_Previos(femaleFactorsDTO.getPreviousAbortions())
            .Fumador_Femenino(boolToInt(femalePatientDTO.getSmoker()))
            .Consumo_Alcohol_Femenino(femalePatientDTO.getAlcoholConsumption())
            .Nivel_Ejercicio_Femenino(femalePatientDTO.getExerciseLevel())
            .Tipo_Alimentacion_Femenino(femalePatientDTO.getDietType())
            .Historial_Familiar_Infertilidad_Femenino(boolToInt(femaleFactorsDTO.getFamilyInfertilityHistory()))
            .build();

        // Llamar a la API del modelo ML
        MLPredictionResponse mlResponse = mlClientService.getPrediction(mlRequest);

        // Serializar el explanation (SHAP) a JSON para persistirlo
        String explanationJson = null;
        if (mlResponse.getExplanation() != null) {
            try {
                explanationJson = objectMapper.writeValueAsString(mlResponse.getExplanation());
            } catch (Exception e) {
                // Si falla la serialización, se guarda sin explanation (no bloquea la predicción)
                explanationJson = null;
            }
        }

        // Guardar predicción con el resultado real del modelo
        Prediction prediction = Prediction.builder()
            .riskLevel(mlResponse.getRiskLevel())
            .probability(mlResponse.getProbability())
            .explanation(explanationJson)
            .date(LocalDateTime.now())
            .couple(couple)
            .user(user)
            .build();

        predictionRepository.save(prediction);

        return toDTO(prediction, malePatient, femalePatient);
    }

    @Transactional
    public PredictionDTO updatePrediction(Long id, PredictionDTO predictionDTO) {
        Prediction existing = predictionRepository.findById(id).orElse(null);
        if (existing == null) return null;

        PatientDTO malePatientDTO = predictionDTO.getCouple().getMalePatient();
        PatientDTO femalePatientDTO = predictionDTO.getCouple().getFemalePatient();
        MaleFactorsDTO maleFactorsDTO = malePatientDTO.getMaleFactors();
        FemaleFactorsDTO femaleFactorsDTO = femalePatientDTO.getFemaleFactors();

        // Reconstruir el request ML con los datos actualizados
        MLPredictionRequest mlRequest = MLPredictionRequest.builder()
            .Edad_Masculino(malePatientDTO.getAge())
            .IMC_Masculino(malePatientDTO.getImc())
            .Concentracion_Esperma(maleFactorsDTO.getSpermCountMPerMl())
            .Motilidad_Espermatica(maleFactorsDTO.getSpermMotilityPct())
            .Morfologia_Espermatica(maleFactorsDTO.getSpermMorphologyPct())
            .Varicocele(boolToInt(maleFactorsDTO.getVaricocele()))
            .Exposicion_Toxicos_Calor_Masculino(boolToInt(maleFactorsDTO.getHeatToxicExposure()))
            .Fumador_Masculino(boolToInt(malePatientDTO.getSmoker()))
            .Consumo_Alcohol_Masculino(malePatientDTO.getAlcoholConsumption())
            .Nivel_Ejercicio_Masculino(malePatientDTO.getExerciseLevel())
            .Tipo_Alimentacion_Masculino(malePatientDTO.getDietType())
            .Historial_Familiar_Infertilidad_Masculino(boolToInt(maleFactorsDTO.getFamilyInfertilityHistory()))
            .Edad_Femenino(femalePatientDTO.getAge())
            .IMC_Femenino(femalePatientDTO.getImc())
            .Ciclo_Menstrual(boolToInt(femaleFactorsDTO.getPeriodRegularity()))
            .PCOS(boolToInt(femaleFactorsDTO.getPcos()))
            .Endometriosis(boolToInt(femaleFactorsDTO.getEndometriosis()))
            .Hormona_AMH(femaleFactorsDTO.getAmh())
            .Hormona_FSH(femaleFactorsDTO.getFsh())
            .Obstruccion_Tubaria(boolToInt(femaleFactorsDTO.getTubalObstruction()))
            .Abortos_Previos(femaleFactorsDTO.getPreviousAbortions())
            .Fumador_Femenino(boolToInt(femalePatientDTO.getSmoker()))
            .Consumo_Alcohol_Femenino(femalePatientDTO.getAlcoholConsumption())
            .Nivel_Ejercicio_Femenino(femalePatientDTO.getExerciseLevel())
            .Tipo_Alimentacion_Femenino(femalePatientDTO.getDietType())
            .Historial_Familiar_Infertilidad_Femenino(boolToInt(femaleFactorsDTO.getFamilyInfertilityHistory()))
            .build();

        // Re-predecir con el modelo ML
        MLPredictionResponse mlResponse = mlClientService.getPrediction(mlRequest);

        String explanationJson = null;
        if (mlResponse.getExplanation() != null) {
            try {
                explanationJson = objectMapper.writeValueAsString(mlResponse.getExplanation());
            } catch (Exception e) {
                explanationJson = null;
            }
        }

        // Actualizar campos de la predicción existente
        existing.setRiskLevel(mlResponse.getRiskLevel());
        existing.setProbability(mlResponse.getProbability());
        existing.setExplanation(explanationJson);
        existing.setDate(java.time.LocalDateTime.now());

        // Actualizar factores de la pareja existente
        Couple couple = existing.getCouple();
        patientService.updateMaleFactors(maleFactorsDTO, couple);
        patientService.updateFemaleFactors(femaleFactorsDTO, couple);

        Patient malePatient = couple.getPatients().stream().filter(p -> p.getSex() != null && p.getSex() == 'M').findFirst().orElse(null);
        Patient femalePatient = couple.getPatients().stream().filter(p -> p.getSex() != null && p.getSex() == 'F').findFirst().orElse(null);

        if (malePatient != null) patientService.updatePatient(malePatientDTO, malePatient);
        if (femalePatient != null) patientService.updatePatient(femalePatientDTO, femalePatient);

        predictionRepository.save(existing);

        return toDTO(existing, malePatient, femalePatient);
    }

    @Transactional
    public void deletePrediction(Long id) {
        predictionRepository.deleteById(id);
    }

    public List<PredictionDTO> getPredictionsByUser() {
        String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByUsername(username).orElseThrow();

        return predictionRepository.findByUser_Id(user.getId())
            .stream()
            .map(p -> {
                Patient male = p.getCouple().getPatients().stream().filter(pa -> pa.getSex() != null && pa.getSex() == 'M').findFirst().orElse(null);
                Patient female = p.getCouple().getPatients().stream().filter(pa -> pa.getSex() != null && pa.getSex() == 'F').findFirst().orElse(null);
                return toDTO(p, male, female);
            })
            .collect(Collectors.toList());
    }

    public PredictionDTO getPrediction(Long id) {
        Prediction prediction = predictionRepository.findById(id).orElseThrow();
        Patient male = prediction.getCouple().getPatients().stream().filter(pa -> pa.getSex() != null && pa.getSex() == 'M').findFirst().orElse(null);
        Patient female = prediction.getCouple().getPatients().stream().filter(pa -> pa.getSex() != null && pa.getSex() == 'F').findFirst().orElse(null);
        return toDTO(prediction, male, female);
    }

    private PredictionDTO toDTO(Prediction prediction, Patient malePatient, Patient femalePatient) {
        MaleFactorsDTO maleFactorsDTO = prediction.getCouple().getMaleFactors().isEmpty() ? null :
            MaleFactorsDTO.builder()
                .id(prediction.getCouple().getMaleFactors().get(0).getId())
                .spermCountMPerMl(prediction.getCouple().getMaleFactors().get(0).getSpermCountMPerMl())
                .spermMotilityPct(prediction.getCouple().getMaleFactors().get(0).getSpermMotilityPct())
                .spermMorphologyPct(prediction.getCouple().getMaleFactors().get(0).getSpermMorphologyPct())
                .varicocele(prediction.getCouple().getMaleFactors().get(0).getVaricocele())
                .heatToxicExposure(prediction.getCouple().getMaleFactors().get(0).getHeatToxicExposure())
                .familyInfertilityHistory(prediction.getCouple().getMaleFactors().get(0).getFamilyInfertilityHistory())
                .build();

        FemaleFactorsDTO femaleFactorsDTO = prediction.getCouple().getFemaleFactors().isEmpty() ? null :
            FemaleFactorsDTO.builder()
                .id(prediction.getCouple().getFemaleFactors().get(0).getId())
                .pcos(prediction.getCouple().getFemaleFactors().get(0).getPcos())
                .previousAbortions(prediction.getCouple().getFemaleFactors().get(0).getPreviousAbortions())
                .periodRegularity(prediction.getCouple().getFemaleFactors().get(0).getPeriodRegularity())
                .endometriosis(prediction.getCouple().getFemaleFactors().get(0).getEndometriosis())
                .amh(prediction.getCouple().getFemaleFactors().get(0).getAmh())
                .fsh(prediction.getCouple().getFemaleFactors().get(0).getFsh())
                .tubalObstruction(prediction.getCouple().getFemaleFactors().get(0).getTubalObstruction())
                .familyInfertilityHistory(prediction.getCouple().getFemaleFactors().get(0).getFamilyInfertilityHistory())
                .build();

        CoupleDTO coupleDTO = CoupleDTO.builder()
            .id(prediction.getCouple().getId())
            .malePatient(patientService.toDTO(malePatient, maleFactorsDTO, null))
            .femalePatient(patientService.toDTO(femalePatient, null, femaleFactorsDTO))
            .build();

        // Deserializar el explanation (SHAP) guardado como JSON
        Map<String, Double> explanationMap = null;
        if (prediction.getExplanation() != null && !prediction.getExplanation().isBlank()) {
            try {
                explanationMap = objectMapper.readValue(
                        prediction.getExplanation(),
                        new com.fasterxml.jackson.core.type.TypeReference<Map<String, Double>>() {}
                );
            } catch (Exception e) {
                explanationMap = null;
            }
        }

        return PredictionDTO.builder()
            .id(prediction.getId())
            .riskLevel(prediction.getRiskLevel())
            .probability(prediction.getProbability())
            .explanation(explanationMap)
            .date(prediction.getDate())
            .couple(coupleDTO)
            .build();
    }

    private Integer boolToInt(Boolean value) {
        return (value != null && value) ? 1 : 0;
    }
}