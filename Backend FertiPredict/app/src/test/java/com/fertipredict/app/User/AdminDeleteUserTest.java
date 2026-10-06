package com.fertipredict.app.User;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.Optional;
import org.springframework.web.server.ResponseStatusException;

class AdminDeleteUserTest {
    UserRepository users = mock(UserRepository.class);
    CurrentUser current = mock(CurrentUser.class);
    AdminUserService service = new AdminUserService(users, current);
    User target = User.builder().id(2L).role(Role.USER).build();
    void setup() {
        when(current.get()).thenReturn(User.builder().id(1L).role(Role.ADMIN).build());
        when(users.lockById(2L)).thenReturn(Optional.of(target));
    }
    @Test void deletesAccountWithoutPredictions() {
        setup(); service.delete(2L);
        verify(users).delete(target); verify(users).flush();
    }
    @Test void preservesHistory() {
        setup(); when(users.hasPredictions(2L)).thenReturn(true);
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.delete(2L)).getStatusCode().value());
        verify(users, never()).delete(any());
    }
    @Test void protectsOwnAccount() {
        setup();
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.delete(1L)).getStatusCode().value());
        verify(users, never()).delete(any());
    }
    @Test void requiresActiveAdmin() {
        for (User actor : new User[]{User.builder().id(1L).role(Role.USER).build(), User.builder().id(1L).role(Role.ADMIN).active(false).build()}) {
            when(current.get()).thenReturn(actor);
            assertEquals(403, assertThrows(ResponseStatusException.class, () -> service.delete(2L)).getStatusCode().value());
        }
        verify(users, never()).delete(any());
    }
    @Test void missingAccountReturnsNotFound() {
        setup();
        assertEquals(404, assertThrows(ResponseStatusException.class, () -> service.delete(3L)).getStatusCode().value());
    }
    @Test void concurrentReferenceReturnsConflict() {
        setup(); doThrow(new org.springframework.dao.DataIntegrityViolationException("reference")).when(users).flush();
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.delete(2L)).getStatusCode().value());
    }
}
