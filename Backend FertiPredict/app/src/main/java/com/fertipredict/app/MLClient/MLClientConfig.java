package com.fertipredict.app.MLClient;
 
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
 
@Configuration
public class MLClientConfig {
 
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}