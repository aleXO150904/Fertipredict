package com.fertipredict.app.Prediction;

import com.fertipredict.app.MLClient.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.http.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;
import static org.junit.jupiter.api.Assertions.*;

class MLAvailabilityTest {
    RestTemplate rest = new RestTemplate();
    MockRestServiceServer server = MockRestServiceServer.bindTo(rest).build();
    MLClientService service = new MLClientService(rest);
    MLPredictionRequest request = MLPredictionRequest.builder().build();
    void url(String url) { ReflectionTestUtils.setField(service, "mlApiUrl", url); }
    String success = "{\"riskLevel\":\"LOW\",\"probability\":0.83,\"explanation\":{}}";
    @Test void transientFailureRetriesOnlyModelAndAcceptsFullEndpoint() {
        url("https://model.test/predict/");
        server.expect(requestTo("https://model.test/predict")).andExpect(method(HttpMethod.POST)).andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));
        server.expect(requestTo("https://model.test/predict")).andRespond(withSuccess(success, MediaType.APPLICATION_JSON));
        assertEquals("LOW", service.getPrediction(request).getRiskLevel()); server.verify();
    }
    @Test void validationFailureIsNotUnavailableAndNotRetried() {
        url("https://model.test");
        server.expect(requestTo("https://model.test/predict")).andRespond(withStatus(HttpStatus.valueOf(422)));
        var ex = assertThrows(MLServiceException.class, () -> service.getPrediction(request));
        assertEquals(422, ex.status); assertEquals("ML_INPUT_REJECTED", ex.code); server.verify();
    }
    @Test void modelAuthenticationErrorNeverBecomesUser401() {
        url("https://model.test");
        server.expect(requestTo("https://model.test/predict")).andRespond(withStatus(HttpStatus.UNAUTHORIZED));
        var ex = assertThrows(MLServiceException.class, () -> service.getPrediction(request));
        assertEquals(502, ex.status); assertEquals("ML_CONFIGURATION", ex.code); server.verify();
    }
    @Test void transportFailureStopsAfterTwoAttempts() {
        url("https://model.test");
        server.expect(requestTo("https://model.test/predict")).andRespond(withException(new java.net.SocketTimeoutException()));
        server.expect(requestTo("https://model.test/predict")).andRespond(withException(new java.net.SocketTimeoutException()));
        var ex = assertThrows(MLServiceException.class, () -> service.getPrediction(request));
        assertEquals(503, ex.status); assertEquals("ML_CONNECTION", ex.code); server.verify();
    }
    @Test void invalidResponseDoesNotReturnPrediction() {
        url("https://model.test");
        server.expect(requestTo("https://model.test/predict")).andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));
        assertEquals("ML_INVALID_RESPONSE", assertThrows(MLServiceException.class, () -> service.getPrediction(request)).code);
        server.verify();
    }
    @Test void invalidUrlFailsWithoutSendingClinicalData() {
        url("https://model.test?query=invalid");
        assertEquals("ML_CONFIGURATION", assertThrows(MLServiceException.class, () -> service.getPrediction(request)).code);
        server.verify();
    }
}
