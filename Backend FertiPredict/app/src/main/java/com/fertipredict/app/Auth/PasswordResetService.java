package com.fertipredict.app.Auth;

import com.fertipredict.app.User.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PasswordResetService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final ObjectProvider<JavaMailSender> sender;
    private final String frontendUrl;
    private final String from;
    private final boolean enabled;
    private final SecureRandom random = new SecureRandom();

    public PasswordResetService(UserRepository users, PasswordEncoder encoder,
            ObjectProvider<JavaMailSender> sender,
            @Value("${app.password-reset.frontend-url:}") String frontendUrl,
            @Value("${app.password-reset.from:}") String from,
            @Value("${app.password-reset.enabled:false}") boolean enabled) {
        this.users = users; this.encoder = encoder; this.sender = sender;
        this.frontendUrl = frontendUrl; this.from = from; this.enabled = enabled;
    }

    public void requireConfigured() {
        if (!enabled || sender.getIfAvailable() == null || from.isBlank()
                || !(frontendUrl.startsWith("https://") || frontendUrl.startsWith("http://localhost:"))
                || frontendUrl.contains("#") || frontendUrl.contains("?")) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "La recuperación por correo no está disponible en este momento.");
        }
    }

    // Same HTTP response for existing and unknown accounts; mail runs off the request thread.
    @Async("passwordResetExecutor")
    @Transactional
    public void sendReset(String email) {
        var account = users.lockByUsername(email);
        if (account.isEmpty()) return;
        var user = account.get();
        var now = Instant.now();
        if (user.getResetRequestedAt() != null
                && now.isBefore(user.getResetRequestedAt().plusSeconds(60))) return;
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        user.setResetTokenHash(hash(token));
        user.setResetTokenExpiresAt(now.plus(Duration.ofMinutes(20)));
        user.setResetRequestedAt(now);
        users.save(user);
        var message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(user.getUsername());
        message.setSubject("Restablece tu contraseña de FertiPredict");
        message.setText("Para cambiar tu contraseña, abre este enlace. Caduca en 20 minutos y solo puede usarse una vez.\n\n"
            + frontendUrl + "#reset-password=" + token
            + "\n\nSi no solicitaste este cambio, ignora este correo.");
        try {
            sender.getObject().send(message);
        } catch (org.springframework.mail.MailException error) {
            // Do not log the message, address or token.
            user.setResetTokenHash(null);
            user.setResetTokenExpiresAt(null);
            org.slf4j.LoggerFactory.getLogger(getClass()).error("Password reset email delivery failed; check mail provider credentials, verified sender and delivery logs ({})", error.getClass().getSimpleName());
        }
    }

    @Transactional
    public void reset(String token, String password) {
        if (password == null || password.length() < 12
                || password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "La contraseña debe tener al menos 12 caracteres y un máximo de 72 bytes.");
        }
        if (token == null || !token.matches("[A-Za-z0-9_-]{43}")) throw invalid();
        var user = users.lockByResetTokenHash(hash(token)).orElseThrow(PasswordResetService::invalid);
        if (user.getResetTokenExpiresAt() == null || !Instant.now().isBefore(user.getResetTokenExpiresAt()))
            throw invalid();
        user.setPassword(encoder.encode(password));
        user.setResetTokenHash(null);
        user.setResetTokenExpiresAt(null);
        user.setCredentialsVersion(user.getCredentialsVersion() == null ? 1L : user.getCredentialsVersion() + 1);
        users.save(user);
    }

    static String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException impossible) { throw new IllegalStateException(impossible); }
    }
    private static ResponseStatusException invalid() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "El enlace no es válido o ha caducado. Solicita uno nuevo.");
    }
}
