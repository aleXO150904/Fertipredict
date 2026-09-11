package com.fertipredict.app.Auth;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class PasswordResetController {
    private final PasswordResetService service;
    public record ForgotRequest(String email) {}
    public record ResetRequest(String token, String password) {}

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgot(@RequestBody ForgotRequest request) {
        service.requireConfigured();
        String email = request.email() == null ? "" : request.email().trim();
        if (email.length() > 254 || !email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingresa un correo válido.");
        try { service.sendReset(email); }
        catch (org.springframework.core.task.TaskRejectedException busy) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Intenta de nuevo en unos minutos.");
        }
        return ResponseEntity.accepted().cacheControl(CacheControl.noStore()).body(Map.of("message",
            "Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> reset(@RequestBody ResetRequest request) {
        service.reset(request.token(), request.password());
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }
}
