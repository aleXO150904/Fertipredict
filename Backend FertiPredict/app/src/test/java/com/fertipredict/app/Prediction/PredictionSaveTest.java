package com.fertipredict.app.Prediction;

import com.fertipredict.app.Couple.*;
import com.fertipredict.app.User.*;
import com.fertipredict.app.Patient.*;
import com.fertipredict.app.MLClient.*;
import com.fertipredict.app.MaleFactors.MaleFactorsDTO;
import com.fertipredict.app.FemaleFactors.FemaleFactorsDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PredictionSaveTest {
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }
    @Test void saveHasRequiredDateBeforeRepositoryAndReturnsTimezone() {
        var predictions = mock(PredictionRepository.class);
        var users = mock(UserRepository.class);
        var couples = mock(CoupleRepository.class);
        var patients = mock(PatientService.class);
        var ml = mock(MLClientService.class);
        var service = new PredictionService(predictions, mock(CurrentUser.class), couples, patients, users, ml);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("test@example.com", "unused"));
        when(users.findByUsername("test@example.com")).thenReturn(java.util.Optional.of(User.builder().id(1L).build()));
        Couple couple = new Couple(); couple.setId(1L);
        when(couples.save(any())).thenReturn(couple);
        MLPredictionResponse response = new MLPredictionResponse();
        response.setRiskLevel("LOW"); response.setProbability(0.83f);
        when(ml.getPrediction(any())).thenReturn(response);
        when(predictions.saveAndFlush(any())).thenAnswer(call -> {
            Prediction p = call.getArgument(0);
            assertNotNull(p.getDate()); assertNotNull(p.getCreatedAt());
            assertEquals(p.getCreatedAt().atZone(Prediction.DISPLAY_ZONE).toLocalDateTime(), p.getDate());
            p.setId(7L); return p;
        });
        var request = PredictionDTO.builder().couple(CoupleDTO.builder()
            .malePatient(PatientDTO.builder().maleFactors(MaleFactorsDTO.builder().build()).build())
            .femalePatient(PatientDTO.builder().femaleFactors(FemaleFactorsDTO.builder().build()).build()).build()).build();
        var result = service.createPrediction(request);
        assertEquals(7L, result.getId());
        assertTrue(result.getDate().endsWith("-05:00"));
        assertEquals("America/Lima", result.getDateTimeZone());
        assertNull(result.getUpdatedAt());
        verify(predictions).saveAndFlush(any());
    }
    @Test void persistenceAndModelErrorsAreNotAuthenticationFailures() {
        var handler = new PredictionErrorHandler();
        assertEquals(500, handler.persistenceFailure(new org.springframework.dao.DataIntegrityViolationException("test")).getStatusCode().value());
        assertEquals(502, handler.modelUnavailable(new org.springframework.web.client.RestClientException("test")).getStatusCode().value());
    }
}
