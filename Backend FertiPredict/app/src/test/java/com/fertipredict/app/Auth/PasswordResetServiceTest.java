package com.fertipredict.app.Auth;

import com.fertipredict.app.User.*;
import com.fertipredict.app.Jwt.JwtService;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.mockito.ArgumentCaptor;

class PasswordResetServiceTest {
    UserRepository users = mock(UserRepository.class);
    JavaMailSender mail = mock(JavaMailSender.class);
    @SuppressWarnings("unchecked")
    ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
    BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    PasswordResetService service;
    User user;

    @BeforeEach void setup() {
        when(provider.getObject()).thenReturn(mail);
        when(provider.getIfAvailable()).thenReturn(mail);
        service = new PasswordResetService(users, encoder, provider, "https://fertipredict.vercel.app/", "test@example.com", true);
        user = User.builder().id(1L).username("person@example.com").password(encoder.encode("old-password-value")).role(Role.USER).build();
    }
    @Test void sendsOpaqueExpiringTokenAndThrottles() {
        when(users.lockByUsername(user.getUsername())).thenReturn(Optional.of(user));
        service.sendReset(user.getUsername());
        var captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mail).send(captor.capture());
        String token = captor.getValue().getText().split("#reset-password=")[1].split("\n")[0];
        assertEquals(43, token.length());
        assertEquals(PasswordResetService.hash(token), user.getResetTokenHash());
        assertTrue(user.getResetTokenExpiresAt().isAfter(Instant.now().plusSeconds(1100)));
        service.sendReset(user.getUsername());
        verify(mail, times(1)).send(any(SimpleMailMessage.class));
    }
    @Test void unknownAccountDoesNotSendMail() {
        when(users.lockByUsername(anyString())).thenReturn(Optional.empty());
        service.sendReset("missing@example.com");
        verifyNoInteractions(mail);
    }
    @Test void resetEncodesPasswordConsumesTokenAndInvalidatesOldSession() {
        String token = "a".repeat(43);
        user.setResetTokenHash(PasswordResetService.hash(token));
        user.setResetTokenExpiresAt(Instant.now().plusSeconds(600));
        when(users.lockByResetTokenHash(anyString())).thenAnswer(call ->
            call.getArgument(0).equals(user.getResetTokenHash()) ? Optional.of(user) : Optional.empty());
        var jwt = new JwtService();
        String before = jwt.getToken(user);
        assertTrue(jwt.isTokenValid(before, user));
        service.reset(token, "a-new-password-value");
        assertTrue(encoder.matches("a-new-password-value", user.getPassword()));
        assertFalse(jwt.isTokenValid(before, user));
        assertTrue(jwt.isTokenValid(jwt.getToken(user), user));
        assertNull(user.getResetTokenHash());
        assertThrows(ResponseStatusException.class, () -> service.reset(token, "another-password-value"));
    }
    @Test void rejectsExpiredAndMalformedTokensWithoutChangingPassword() {
        user.setResetTokenExpiresAt(Instant.now().minusSeconds(1));
        when(users.lockByResetTokenHash(anyString())).thenReturn(Optional.of(user));
        String before = user.getPassword();
        assertThrows(ResponseStatusException.class, () -> service.reset("a".repeat(43), "a-new-password-value"));
        assertThrows(ResponseStatusException.class, () -> service.reset("bad", "a-new-password-value"));
        assertEquals(before, user.getPassword());
        verify(users, never()).save(any());
    }
    @Test void rejectsShortOrOversizedPasswords() {
        assertThrows(ResponseStatusException.class, () -> service.reset("a".repeat(43), "short"));
        assertThrows(ResponseStatusException.class, () -> service.reset("a".repeat(43), "é".repeat(37)));
        verifyNoInteractions(users);
    }
    @Test void missingMailConfigurationIsExplicit() {
        var disabled = new PasswordResetService(users, encoder, provider, "", "", false);
        assertThrows(ResponseStatusException.class, disabled::requireConfigured);
        assertDoesNotThrow(service::requireConfigured);
    }
}
