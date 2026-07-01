package com.fertipredict.app.Prediction;

import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;


@RestController
@RequestMapping(value = "/api/v1/prediction")
@RequiredArgsConstructor
public class PredictionController {
    private final PredictionService predictionService;

    @PostMapping("/register")
    public ResponseEntity<PredictionDTO> createPrediction(@RequestBody PredictionDTO predictionDTO) {
        return ResponseEntity.ok(predictionService.createPrediction(predictionDTO));
    }

    @GetMapping
    public ResponseEntity<List<PredictionDTO>> getPredictionsByUser() {
        return ResponseEntity.ok(predictionService.getPredictionsByUser());
    }

    @GetMapping(value = "{id}")
    public ResponseEntity<PredictionDTO> getPrediction(@PathVariable Long id) {
        PredictionDTO predictionDTO = predictionService.getPrediction(id);
        if (predictionDTO == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(predictionDTO);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PredictionDTO> updatePrediction(
            @PathVariable Long id,
            @RequestBody PredictionDTO predictionDTO) {
        PredictionDTO updated = predictionService.updatePrediction(id, predictionDTO);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrediction(@PathVariable Long id) {
        predictionService.deletePrediction(id);
        return ResponseEntity.noContent().build();
    }
}