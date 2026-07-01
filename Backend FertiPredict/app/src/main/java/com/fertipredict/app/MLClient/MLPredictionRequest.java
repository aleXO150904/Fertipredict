package com.fertipredict.app.MLClient;
 
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
 
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MLPredictionRequest {
    // Masculino
    Integer Edad_Masculino;
    Float IMC_Masculino;
    Integer Concentracion_Esperma;
    Integer Motilidad_Espermatica;
    Float Morfologia_Espermatica;
    Integer Varicocele;
    Integer Exposicion_Toxicos_Calor_Masculino;
    Integer Fumador_Masculino;
    Integer Consumo_Alcohol_Masculino;
    Integer Nivel_Ejercicio_Masculino;
    Integer Tipo_Alimentacion_Masculino;
    Integer Historial_Familiar_Infertilidad_Masculino;
 
    // Femenino
    Integer Edad_Femenino;
    Float IMC_Femenino;
    Integer Ciclo_Menstrual;
    Integer PCOS;
    Integer Endometriosis;
    Float Hormona_AMH;
    Float Hormona_FSH;
    Integer Obstruccion_Tubaria;
    Integer Abortos_Previos;
    Integer Fumador_Femenino;
    Integer Consumo_Alcohol_Femenino;
    Integer Nivel_Ejercicio_Femenino;
    Integer Tipo_Alimentacion_Femenino;
    Integer Historial_Familiar_Infertilidad_Femenino;
}