package com.fertipredict.app.MLClient;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.*;

@Service
@RequiredArgsConstructor
public class MLClientService {
    private final RestTemplate restTemplate;
    @Value("${ml.api.url}")
    private String mlApiUrl;

    public MLPredictionResponse getPrediction(MLPredictionRequest request) {
        String url = endpoint();
        // Retry only the stateless model call, never the database transaction.
        for (int attempt = 0; attempt < 2; attempt++) {
            try {
                var response = restTemplate.postForObject(url, request, MLPredictionResponse.class);
                if (response == null || response.getRiskLevel() == null || response.getProbability() == null
                    || !java.util.Set.of("LOW", "MODERATE", "HIGH").contains(response.getRiskLevel())
                    || !Float.isFinite(response.getProbability()) || response.getProbability() < 0 || response.getProbability() > 100)
                    throw failure(502, "ML_INVALID_RESPONSE", "El modelo devolvió una respuesta inválida. No se guardó la predicción.", null);
                return response;
            } catch (RestClientResponseException ex) {
                int status = ex.getStatusCode().value();
                if ((status == 502 || status == 503 || status == 504) && attempt == 0) continue;
                if (status == 400 || status == 422)
                    throw failure(422, "ML_INPUT_REJECTED", "El modelo rechazó los datos enviados. Revisa que todos los factores estén completos y sean válidos. No se guardó la predicción.", status);
                if (status == 401 || status == 403 || status == 404 || status == 405)
                    throw failure(502, "ML_CONFIGURATION", "No se pudo acceder a la API del modelo. El administrador debe revisar ML_API_URL y los permisos del servicio.", status);
                throw failure(502, "ML_UPSTREAM_ERROR", "El modelo respondió con un error. No se guardó la predicción; tus datos siguen en el formulario.", status);
            } catch (ResourceAccessException ex) {
                if (attempt == 0) continue;
                throw failure(503, "ML_CONNECTION", "El modelo no respondió tras dos intentos; puede estar iniciándose o sin conexión. Espera un momento y vuelve a intentarlo.", null);
            } catch (RestClientException ex) {
                throw failure(502, "ML_INVALID_RESPONSE", "No se pudo interpretar la respuesta del modelo. No se guardó la predicción.", null);
            }
        }
        throw new IllegalStateException("Unreachable");
    }

    private String endpoint() {
        if (mlApiUrl == null || mlApiUrl.isBlank())
            throw failure(502, "ML_CONFIGURATION", "Falta configurar ML_API_URL en el backend.", null);
        String base = mlApiUrl.trim().replaceAll("/+$", "");
        if (!base.contains("://")) base = "https://" + base;
        try {
            var uri = java.net.URI.create(base);
            if (!("https".equals(uri.getScheme()) || "http".equals(uri.getScheme())) || uri.getHost() == null
                || uri.getQuery() != null || uri.getFragment() != null || uri.getUserInfo() != null)
                throw new IllegalArgumentException();
        } catch (IllegalArgumentException ex) {
            throw failure(502, "ML_CONFIGURATION", "ML_API_URL no contiene una dirección HTTP válida.", null);
        }
        return base.endsWith("/predict") ? base : base + "/predict";
    }

    private MLServiceException failure(int status, String code, String message, Integer upstream) {
        return new MLServiceException(status, code, message, upstream);
    }
}
