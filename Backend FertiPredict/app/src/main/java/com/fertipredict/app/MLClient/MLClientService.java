package com.fertipredict.app.MLClient;
 
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
 
@Service
@RequiredArgsConstructor
public class MLClientService {
 
    private final RestTemplate restTemplate;
 
    @Value("${ml.api.url}")
    private String mlApiUrl;
 
    public MLPredictionResponse getPrediction(MLPredictionRequest request) {
        String url = mlApiUrl + "/predict";
        return restTemplate.postForObject(url, request, MLPredictionResponse.class);
    }
}
