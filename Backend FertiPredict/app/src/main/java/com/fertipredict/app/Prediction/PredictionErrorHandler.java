package com.fertipredict.app.Prediction;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = PredictionController.class)
public class PredictionErrorHandler {
    @ExceptionHandler(org.springframework.web.client.RestClientException.class)
    public ResponseEntity<Map<String, String>> modelUnavailable(org.springframework.web.client.RestClientException ex) {
        return ResponseEntity.status(502).body(Map.of("message",
            "El servicio predictivo no pudo completar la solicitud. Tus datos siguen en el formulario. Inténtalo nuevamente."));
    }

    @ExceptionHandler(org.springframework.dao.DataAccessException.class)
    public ResponseEntity<Map<String, String>> persistenceFailure(org.springframework.dao.DataAccessException ex) {
        // Avoid logging SQL parameter values, which may contain patient information.
        String reference = java.util.UUID.randomUUID().toString();
        Throwable cause = ex.getMostSpecificCause();
        String sqlState = cause instanceof java.sql.SQLException sql ? sql.getSQLState() : "unknown";
        org.slf4j.LoggerFactory.getLogger(PredictionErrorHandler.class)
            .error("Prediction persistence failure reference={} type={} sqlState={}", reference, ex.getClass().getSimpleName(), sqlState);
        return ResponseEntity.status(500).body(Map.of("message",
            "No se pudo guardar la predicción en la base de datos. Conservamos el formulario. Referencia: " + reference));
    }
}
