package com.fertipredict.app.Auth;

import com.fertipredict.app.User.*;
import com.fertipredict.app.Jwt.JwtService;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LastLoginTest {
    UserRepository users = mock(UserRepository.class);
    JwtService jwt = mock(JwtService.class);
    AuthenticationManager authentication = mock(AuthenticationManager.class);
    AuthService service = new AuthService(users, jwt, mock(PasswordEncoder.class), authentication);
    LoginRequest request = new LoginRequest("user@example.com", "test-password");
    @Test void successfulLoginRecordsServerTime() {
        User user = User.builder().id(7L).username(request.getUsername()).role(Role.USER).build();
        when(users.findByUsername(request.getUsername())).thenReturn(Optional.of(user));
        when(jwt.getToken(user)).thenReturn("test-token");
        var before = java.time.Instant.now();
        assertEquals("test-token", service.login(request).getToken());
        var at = org.mockito.ArgumentCaptor.forClass(java.time.Instant.class);
        verify(users).recordLogin(eq(7L), at.capture());
        assertFalse(at.getValue().isBefore(before));
        assertFalse(at.getValue().isAfter(java.time.Instant.now()));
    }
    @Test void incorrectPasswordDoesNotRecordLogin() {
        when(authentication.authenticate(any())).thenThrow(new BadCredentialsException("Invalid"));
        assertThrows(BadCredentialsException.class, () -> service.login(request));
        verifyNoInteractions(users, jwt);
    }
    @Test void disabledAccountDoesNotRecordLogin() {
        when(users.findByUsername(request.getUsername())).thenReturn(Optional.of(User.builder().id(7L).active(false).build()));
        assertThrows(DisabledException.class, () -> service.login(request));
        verify(users, never()).recordLogin(any(), any());
        verifyNoInteractions(jwt);
    }
}
