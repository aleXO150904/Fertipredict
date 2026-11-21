package com.fertipredict.app.MLClient;
 
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
 
@Configuration
public class MLClientConfig {
 
    @Bean
    public RestTemplate restTemplate(
        @org.springframework.beans.factory.annotation.Value("${ml.api.read-timeout-seconds:90}") int readTimeoutSeconds) {
        var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(java.time.Duration.ofSeconds(10));
        factory.setReadTimeout(java.time.Duration.ofSeconds(Math.max(1, readTimeoutSeconds)));
        return new RestTemplate(factory);
    }
}
