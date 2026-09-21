package com.fertipredict.app.Prediction;

import com.fertipredict.app.User.*;
import com.fertipredict.app.Couple.CoupleRepository;
import com.fertipredict.app.Patient.PatientService;
import com.fertipredict.app.MLClient.MLClientService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PredictionAccessTest {
    PredictionRepository predictions = mock(PredictionRepository.class);
    CurrentUser current = mock(CurrentUser.class);
    UserRepository users = mock(UserRepository.class);
    MLClientService ml = mock(MLClientService.class);
    PredictionService service = new PredictionService(predictions, current, mock(CoupleRepository.class), mock(PatientService.class), users, ml);
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }
    @Test void otherDoctorsCannotReadOrModifyPrediction() {
        var owner = User.builder().id(1L).role(Role.USER).build();
        when(current.get()).thenReturn(User.builder().id(2L).role(Role.USER).build());
        when(predictions.findById(4L)).thenReturn(Optional.of(Prediction.builder().id(4L).user(owner).build()));
        assertEquals(403, assertThrows(ResponseStatusException.class, () -> service.getPrediction(4L)).getStatusCode().value());
        assertThrows(ResponseStatusException.class, () -> service.updatePrediction(4L, new PredictionDTO()));
        assertThrows(ResponseStatusException.class, () -> service.deletePrediction(4L));
        verifyNoInteractions(ml);
        verify(predictions, never()).deleteById(any());
    }
    @Test void adminGlobalListAndDoctorOwnList() {
        var actor = User.builder().id(2L).username("actor").role(Role.ADMIN).build();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("actor", null, List.of()));
        when(users.findByUsername("actor")).thenReturn(Optional.of(actor));
        when(predictions.findAll()).thenReturn(List.of());
        when(predictions.findByUser_Id(2L)).thenReturn(List.of());
        assertTrue(service.getPredictionsByUser().isEmpty());
        verify(predictions).findAll();
        actor.setRole(Role.USER);
        assertTrue(service.getPredictionsByUser().isEmpty());
        verify(predictions).findByUser_Id(2L);
    }
    @Test void adminCanDeleteAnotherAuthorsPrediction() {
        when(current.get()).thenReturn(User.builder().id(2L).role(Role.ADMIN).build());
        when(predictions.findById(4L)).thenReturn(Optional.of(Prediction.builder().user(User.builder().id(1L).build()).build()));
        assertDoesNotThrow(() -> service.deletePrediction(4L));
        verify(predictions).deleteById(4L);
    }
    @Test void adminCanRecalculateAnotherAuthorsPredictionWithoutChangingOwner() {
        var owner = User.builder().id(1L).role(Role.USER).build();
        var prediction = Prediction.builder().id(4L).user(owner).build();
        when(current.get()).thenReturn(User.builder().id(2L).role(Role.ADMIN).build());
        when(predictions.findById(4L)).thenReturn(Optional.of(prediction));
        var input = mock(PredictionDTO.class, RETURNS_DEEP_STUBS);
        // Stop at the external ML boundary: authorization must permit recalculation.
        var unavailable = new IllegalStateException("ML unavailable in test");
        when(ml.getPrediction(any())).thenThrow(unavailable);
        assertSame(unavailable, assertThrows(IllegalStateException.class, () -> service.updatePrediction(4L, input)));
        verify(ml).getPrediction(any());
        assertSame(owner, prediction.getUser());
        verify(predictions, never()).save(any());
    }
    @Test void doctorCanDeleteOwnPrediction() {
        var owner = User.builder().id(1L).role(Role.USER).build();
        when(current.get()).thenReturn(owner);
        when(predictions.findById(4L)).thenReturn(Optional.of(Prediction.builder().user(owner).build()));
        service.deletePrediction(4L);
        verify(predictions).deleteById(4L);
    }
}
