package com.fertipredict.app.Prediction;

import com.fertipredict.app.MLClient.MLPredictionRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.http.MockHttpOutputMessage;
import org.springframework.web.client.RestTemplate;
import static org.junit.jupiter.api.Assertions.*;

class MLRequestContractTest {
    @Test void restTemplateSendsExactFastApiFieldNames() throws Exception {
        var request = MLPredictionRequest.builder().Edad_Masculino(36).IMC_Masculino(28f).PCOS(0).Hormona_AMH(1.8f).build();
        var converter = new RestTemplate().getMessageConverters().stream()
            .filter(c -> c.canWrite(MLPredictionRequest.class, MediaType.APPLICATION_JSON)).findFirst().orElseThrow();
        var output = new MockHttpOutputMessage();
        @SuppressWarnings("unchecked")
        var writer = (org.springframework.http.converter.HttpMessageConverter<Object>) converter;
        writer.write(request, MediaType.APPLICATION_JSON, output);
        var json = new com.fasterxml.jackson.databind.ObjectMapper().readTree(output.getBodyAsString());
        assertTrue(json.has("Edad_Masculino"), "Actual serialized keys: " + json);
        assertTrue(json.has("IMC_Masculino"));
        assertTrue(json.has("PCOS"));
        assertTrue(json.has("Hormona_AMH"));
        for (var field : MLPredictionRequest.class.getDeclaredFields()) {
            if (!java.lang.reflect.Modifier.isStatic(field.getModifiers()))
                assertTrue(json.has(field.getName()), "Missing FastAPI field: " + field.getName());
        }
        assertEquals(26, json.size());
    }
}
