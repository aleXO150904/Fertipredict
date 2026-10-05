package com.fertipredict.app.User;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.Optional;
import org.springframework.web.server.ResponseStatusException;

class AdminProfileTest {
    UserRepository users = mock(UserRepository.class);
    CurrentUser current = mock(CurrentUser.class);
    AdminUserService service = new AdminUserService(users, current);
    User target = User.builder().id(2L).role(Role.USER).active(false)
        .username("old@example.com").password("hash").credentialsVersion(3L)
        .resetTokenHash("token").resetTokenExpiresAt(java.time.Instant.now()).build();
    void setup() {
        when(current.get()).thenReturn(User.builder().id(1L).role(Role.ADMIN).build());
        when(users.lockById(2L)).thenReturn(Optional.of(target));
        when(users.saveAndFlush(target)).thenReturn(target);
    }
    AdminUserService.ProfileChange change(String email) {
        return new AdminUserService.ProfileChange(" Ana ", " Pérez ", email);
    }
    @Test void emailChangePreservesAccountAndRevokesCredentials() {
        setup();
        var result = service.updateProfile(2L, change("new@example.com"));
        assertEquals("Ana", result.names());
        assertEquals("Pérez", result.lastnames());
        assertEquals("new@example.com", result.username());
        assertEquals(Role.USER, result.role());
        assertFalse(result.active());
        assertEquals("hash", target.getPassword());
        assertEquals(4L, target.getCredentialsVersion());
        assertNull(target.getResetTokenHash());
        assertNull(target.getResetTokenExpiresAt());
    }
    @Test void nameOnlyChangeKeepsSessions() {
        setup();
        service.updateProfile(2L, change("old@example.com"));
        assertEquals(3L, target.getCredentialsVersion());
        assertEquals("token", target.getResetTokenHash());
    }
    @Test void duplicateEmailRejected() {
        setup();
        when(users.existsByUsernameIgnoreCaseAndIdNot("used@example.com", 2L)).thenReturn(true);
        assertEquals(409, assertThrows(ResponseStatusException.class,
            () -> service.updateProfile(2L, change("used@example.com"))).getStatusCode().value());
        verify(users, never()).saveAndFlush(any());
    }
    @Test void adminTargetsAndNonAdminActorsRejected() {
        setup();
        target.setRole(Role.ADMIN);
        assertEquals(403, assertThrows(ResponseStatusException.class,
            () -> service.updateProfile(2L, change("new@example.com"))).getStatusCode().value());
        when(current.get()).thenReturn(User.builder().role(Role.USER).build());
        assertEquals(403, assertThrows(ResponseStatusException.class,
            () -> service.updateProfile(2L, change("new@example.com"))).getStatusCode().value());
        verify(users, never()).saveAndFlush(any());
    }
    @Test void invalidFieldsRejected() {
        setup();
        for (String email : new String[]{"invalid", "a b@example.com", "a@", "a@b..com"}) {
            assertEquals(400, assertThrows(ResponseStatusException.class,
                () -> service.updateProfile(2L, change(email))).getStatusCode().value());
        }
        assertThrows(ResponseStatusException.class, () -> service.updateProfile(2L,
            new AdminUserService.ProfileChange(" ", "Pérez", "a@example.com")));
        verify(users, never()).saveAndFlush(any());
    }
}
