package com.fertipredict.app.User;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.Optional;
import org.springframework.web.server.ResponseStatusException;

class AdminUserServiceTest {
    UserRepository users = mock(UserRepository.class);
    CurrentUser current = mock(CurrentUser.class);
    AdminUserService service = new AdminUserService(users, current);
    User admin = User.builder().id(1L).role(Role.ADMIN).build();
    @Test void userCannotManageAccounts() {
        when(current.get()).thenReturn(User.builder().id(2L).role(Role.USER).build());
        assertEquals(403, assertThrows(ResponseStatusException.class, () -> service.list()).getStatusCode().value());
        assertThrows(ResponseStatusException.class, () -> service.update(1L, new AdminUserService.Change(Role.USER, false)));
        verify(users, never()).save(any());
    }
    @Test void adminCannotRemoveOwnAccess() {
        when(current.get()).thenReturn(admin);
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.update(1L, new AdminUserService.Change(Role.USER, true))).getStatusCode().value());
        assertThrows(ResponseStatusException.class, () -> service.update(1L, new AdminUserService.Change(Role.ADMIN, false)));
    }
    @Test void deactivationRevokesOldTokensEvenAfterReactivation() {
        when(current.get()).thenReturn(admin);
        User target = User.builder().id(2L).role(Role.USER).username("test@example.com").build();
        when(users.lockById(2L)).thenReturn(Optional.of(target));
        when(users.save(target)).thenReturn(target);
        var jwt = new com.fertipredict.app.Jwt.JwtService();
        String originalToken = jwt.getToken(target);
        assertFalse(service.update(2L, new AdminUserService.Change(Role.USER, false)).active());
        assertFalse(target.isEnabled());
        assertFalse(jwt.isTokenValid(originalToken, target));
        assertTrue(service.update(2L, new AdminUserService.Change(Role.ADMIN, true)).active());
        assertEquals(Role.ADMIN, target.getRole());
        assertFalse(jwt.isTokenValid(originalToken, target));
    }
    @Test void existingAccountsRemainEnabled() {
        assertTrue(User.builder().build().isEnabled());
        assertTrue(User.builder().active(null).build().isEnabled());
    }
    @Test void accessChangePreservesRoleAndRevokesTokens() {
        when(current.get()).thenReturn(admin);
        User target = User.builder().id(2L).role(Role.ADMIN).credentialsVersion(4L).build();
        when(users.lockById(2L)).thenReturn(Optional.of(target));
        when(users.save(target)).thenReturn(target);
        var result = service.updateAccess(2L, new AdminUserService.AccessChange(false));
        assertFalse(result.active());
        assertEquals(Role.ADMIN, result.role());
        assertEquals(5L, target.getCredentialsVersion());
        service.updateAccess(2L, new AdminUserService.AccessChange(false));
        assertEquals(5L, target.getCredentialsVersion());
    }
    @Test void roleChangeCannotReactivateAccount() {
        when(current.get()).thenReturn(admin);
        User target = User.builder().id(2L).role(Role.USER).active(false).build();
        when(users.lockById(2L)).thenReturn(Optional.of(target));
        when(users.save(target)).thenReturn(target);
        var result = service.updateRole(2L, new AdminUserService.RoleChange(Role.ADMIN));
        assertFalse(result.active());
        assertEquals(Role.ADMIN, result.role());
    }
    @Test void missingAccessStateIsRejected() {
        when(current.get()).thenReturn(admin);
        assertEquals(400, assertThrows(ResponseStatusException.class,
            () -> service.updateAccess(2L, new AdminUserService.AccessChange(null))).getStatusCode().value());
        verify(users, never()).save(any());
    }
}
