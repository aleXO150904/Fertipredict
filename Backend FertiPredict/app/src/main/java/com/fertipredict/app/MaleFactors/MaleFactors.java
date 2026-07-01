package com.fertipredict.app.MaleFactors;
 
import com.fertipredict.app.Couple.Couple;

import jakarta.persistence.*;
import lombok.*;
 
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "male_factors")
public class MaleFactors {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @Column(nullable = false)
    private Integer spermCountMPerMl;
 
    @Column(nullable = false)
    private Integer spermMotilityPct;
 
    @Column(nullable = false)
    private Float spermMorphologyPct;
 
    @Column(nullable = false)
    private Boolean varicocele;
 
    @Column(nullable = false)
    private Boolean heatToxicExposure;
 
    @Column(nullable = false)
    private Boolean familyInfertilityHistory;
 
    @ManyToOne
    @JoinColumn(name = "couple_id", nullable = false)
    private Couple couple;
}
 
