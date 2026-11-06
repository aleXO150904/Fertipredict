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

    // Legacy wall-clock value. New rows mirror the authoritative instant in Lima.
    // Existing rows are not assigned an assumed timezone.
    @Column(nullable = false, updatable = false)
    private LocalDateTime date;

    @Column(name = "created_at", updatable = false, columnDefinition = "timestamp with time zone")
    private java.time.Instant createdAt;

    @Column(name = "updated_at", columnDefinition = "timestamp with time zone")
    private java.time.Instant updatedAt;

    public static final java.time.ZoneId DISPLAY_ZONE = java.time.ZoneId.of("America/Lima");

    @PrePersist
    void initializeCreationTime() {
        if (createdAt == null) recordCreation(java.time.Instant.now());
    }

    public void recordCreation(java.time.Instant instant) {
        if (createdAt != null) throw new IllegalStateException("Creation time already recorded");
        createdAt = java.util.Objects.requireNonNull(instant);
        date = LocalDateTime.ofInstant(instant, DISPLAY_ZONE);
    }

    public void recordUpdate(java.time.Instant instant) {
        updatedAt = java.util.Objects.requireNonNull(instant);
    }

    public String displayDate() {
        return createdAt == null ? (date == null ? null : date.toString())
            : createdAt.atZone(DISPLAY_ZONE).toOffsetDateTime().toString();
    }

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