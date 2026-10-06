package com.fertipredict.app.User;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminAccountCreationServiceTest {
    UserRepository users = mock(UserRepository.class);
    CurrentUser current = mock(CurrentUser.class);
    BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
    AdminAccountCreationService service = new AdminAccountCreationService(users, current, encoder);
    AdminAccountCreationService.Request request(Role role, boolean active) {
        return new AdminAccountCreationService.Request(" Ana ", " Pérez ", " ana@example.com ", "Test-password-123", role, active);
    }
    void admin() {
        when(current.get()).thenReturn(User.builder().id(1L).role(Role.ADMIN).build());
    }
    @Test void createsBothRolesWithHashedPasswordAndExplicitAccess() {
        admin();
        when(users.saveAndFlush(any(User.class))).thenAnswer(call -> {
            User u = call.getArgument(0);
            assertNotEquals("Test-password-123", u.getPassword());
            assertTrue(encoder.matches("Test-password-123", u.getPassword()));
            assertNull(u.getLastLoginAt());
            u.setId(2L);
            return u;
        });
        for (Role role : Role.values()) {
            var account = service.create(request(role, role == Role.USER));
            assertEquals(role, account.role());
            assertEquals(role == Role.USER, account.active());
            assertEquals("Ana", account.names());
            assertEquals("Pérez", account.lastnames());
            assertEquals("ana@example.com", account.username());
        }
    }
    @Test void nonAdminAndInactiveAdminCannotCreate() {
        for (User actor : new User[]{User.builder().role(Role.USER).build(), User.builder().role(Role.ADMIN).active(false).build()}) {
            when(current.get()).thenReturn(actor);
            assertEquals(403, assertThrows(ResponseStatusException.class, () -> service.create(request(Role.ADMIN, true))).getStatusCode().value());
        }
        verify(users, never()).saveAndFlush(any());
    }
    @Test void duplicateEmailRejected() {
        admin();
        when(users.existsByUsernameIgnoreCase("ana@example.com")).thenReturn(true);
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.create(request(Role.USER, true))).getStatusCode().value());
        verify(users, never()).saveAndFlush(any());
    }
    @Test void invalidInputRejected() {
        admin();
        var valid = request(Role.USER, true);
        for (var invalid : new AdminAccountCreationService.Request[]{
            new AdminAccountCreationService.Request(" ", "Pérez", "a@example.com", valid.password(), Role.USER, true),
            new AdminAccountCreationService.Request("Ana", "Pérez", "invalid", valid.password(), Role.USER, true),
            new AdminAccountCreationService.Request("Ana", "Pérez", "a@example.com", "short", Role.USER, true),
            new AdminAccountCreationService.Request("Ana", "Pérez", "a@example.com", "é".repeat(37), Role.USER, true),
            new AdminAccountCreationService.Request("Ana", "Pérez", "a@example.com", valid.password(), null, true),
            new AdminAccountCreationService.Request("Ana", "Pérez", "a@example.com", valid.password(), Role.USER, null)
        }) assertEquals(400, assertThrows(ResponseStatusException.class, () -> service.create(invalid)).getStatusCode().value());
        verify(users, never()).saveAndFlush(any());
    }
    @Test void databaseDuplicateReturnsConflict() {
        admin();
        when(users.saveAndFlush(any())).thenThrow(new org.springframework.dao.DataIntegrityViolationException("duplicate"));
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.create(request(Role.USER, true))).getStatusCode().value());
    }
}
