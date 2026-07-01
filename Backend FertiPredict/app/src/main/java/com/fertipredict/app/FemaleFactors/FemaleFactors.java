package com.fertipredict.app.FemaleFactors;

import com.fertipredict.app.Couple.Couple;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
 
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "female_factors")
public class FemaleFactors {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @Column(nullable = false)
    private Boolean pcos;
 
    @Column(nullable = false)
    private Boolean periodRegularity; // Ciclo_Menstrual
 
    @Column(nullable = false)
    private Integer previousAbortions; // Abortos_Previos
 
    @Column(nullable = false)
    private Boolean endometriosis;
 
    @Column(nullable = false)
    private Float amh;
 
    @Column(nullable = false)
    private Float fsh;
 
    @Column(nullable = false)
    private Boolean tubalObstruction;
 
    @Column(nullable = false)
    private Boolean familyInfertilityHistory;
 
    @ManyToOne
    @JoinColumn(name = "couple_id", nullable = false)
    private Couple couple;
}
 
