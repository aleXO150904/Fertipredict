package com.fertipredict.app.Couple;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

import com.fertipredict.app.FemaleFactors.FemaleFactors;
import com.fertipredict.app.MaleFactors.MaleFactors;
import com.fertipredict.app.Patient.Patient;
import com.fertipredict.app.Prediction.Prediction;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "couples")
public class Couple {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @OneToMany(mappedBy = "couple", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Patient> patients = new ArrayList<>();

    @OneToMany(mappedBy = "couple", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<MaleFactors> maleFactors = new ArrayList<>();

    @OneToMany(mappedBy = "couple", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<FemaleFactors> femaleFactors = new ArrayList<>();

    @OneToMany(mappedBy = "couple", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Prediction> predictions = new ArrayList<>();
}
