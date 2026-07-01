package com.fertipredict.app.Prediction;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PredictionRepository extends JpaRepository<Prediction, Long> {
    List<Prediction> findByCouple_Id(Long coupleId);
    List<Prediction> findByUser_Id(Long userId);
}