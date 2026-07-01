package com.fertipredict.app.Patient;

import com.fertipredict.app.Couple.Couple;
import jakarta.persistence.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "patients")
public class Patient {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @Column(nullable = false, length = 100)
    private String fullName;
 
    @Column(nullable = false)
    private Integer age;
 
    @Column(nullable = false, length = 1)
    private Character sex;
 
    @Column(nullable = false, length = 100)
    private String email;
 
    @Column(length = 20)
    private String phone;
 
    @Column(nullable = false)
    private Float imc;
 
    @Column(nullable = false)
    private Boolean smoker;
 
    @Column(nullable = false)
    private Integer exerciseLevel; // 0,1,2,3
 
    @Column(nullable = false)
    private Integer alcoholConsumption; // 0,1,2,3
 
    @Column(nullable = false)
    private Integer dietType; // 0,1,2,3
 
    @ManyToOne
    @JoinColumn(name = "couple_id", nullable = false)
    private Couple couple;
}