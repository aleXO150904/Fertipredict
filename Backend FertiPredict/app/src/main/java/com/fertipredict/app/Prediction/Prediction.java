package com.fertipredict.app.Prediction;

import com.fertipredict.app.Couple.Couple;
import com.fertipredict.app.User.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "predictions")
public class Prediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String riskLevel;

    @Column(nullable = false)
    private LocalDateTime date;

    @Column(nullable = false)
    private Float probability;

    // JSON con los valores SHAP de esta predicción: { "Edad_Masculino": -0.0019, ... }
    @Column(columnDefinition = "TEXT")
    private String explanation;

    @ManyToOne
    @JoinColumn(name = "couple_id", nullable = false)
    private Couple couple;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}