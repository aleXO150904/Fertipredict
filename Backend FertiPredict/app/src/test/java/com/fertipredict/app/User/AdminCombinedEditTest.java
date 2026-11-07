package com.fertipredict.app.User;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.Optional;
import org.springframework.web.server.ResponseStatusException;

class AdminCombinedEditTest {
    UserRepository users = mock(UserRepository.class);
    CurrentUser current = mock(CurrentUser.class);
    AdminUserService service = new AdminUserService(users, current);
    User target = User.builder().id(2L).role(Role.USER).names("Ana").lastnames("Pérez").username("old@example.com").build();
    void setup() {
        when(current.get()).thenReturn(User.builder().id(1L).role(Role.ADMIN).build());
        when(users.lockById(2L)).thenReturn(Optional.of(target));
        when(users.saveAndFlush(target)).thenReturn(target);
    }
    AdminUserService.ProfileChange change() {
        return new AdminUserService.ProfileChange("Nueva", "Apellido", "new@example.com", Role.ADMIN);
    }
    @Test void changesProfileAndRoleWithOneSave() {
        setup(); var result = service.updateProfile(2L, change());
        assertEquals("Nueva", result.names()); assertEquals("new@example.com", result.username());
        assertEquals(Role.ADMIN, result.role()); assertTrue(result.active());
        verify(users, times(1)).saveAndFlush(target);
    }
    @Test void duplicateEmailDoesNotApplyRoleOrOtherFields() {
        setup(); when(users.existsByUsernameIgnoreCaseAndIdNot("new@example.com", 2L)).thenReturn(true);
        assertThrows(ResponseStatusException.class, () -> service.updateProfile(2L, change()));
        assertEquals(Role.USER, target.getRole()); assertEquals("Ana", target.getNames());
        verify(users, never()).saveAndFlush(any());
    }
    @Test void inactiveRoleChangeDoesNotApplyProfile() {
        setup(); target.setActive(false);
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.updateProfile(2L, change())).getStatusCode().value());
        assertEquals("old@example.com", target.getUsername());
        verify(users, never()).saveAndFlush(any());
    }
    @Test void inactiveProfileOnlyEditStillWorks() {
        setup(); target.setActive(false);
        var result = service.updateProfile(2L, new AdminUserService.ProfileChange("Nueva", "Apellido", "new@example.com", Role.USER));
        assertFalse(result.active()); assertEquals(Role.USER, result.role());
    }
    @Test void otherAdminCanBeEditedAndDemotedTogether() {
        setup(); target.setRole(Role.ADMIN);
        var result = service.updateProfile(2L, new AdminUserService.ProfileChange("Nueva", "Apellido", "new@example.com", Role.USER));
        assertEquals(Role.USER, result.role()); assertEquals("Nueva", result.names());
    }
}
