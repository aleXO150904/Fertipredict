package com.fertipredict.app.User;

import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AdminAccountCreationService {
    private final UserRepository users;
    private final CurrentUser currentUser;
    private final PasswordEncoder passwordEncoder;

    public record Request(String names, String lastnames, String username,
                          @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY) String password,
                          Role role, Boolean active) {
        @Override public String toString() { return "AdminAccountCreationRequest[redacted]"; }
    }

    @Transactional
    public AdminUserService.Account create(Request request) {
        User actor = currentUser.get();
        if (actor.getRole() != Role.ADMIN || !actor.isEnabled())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if (request == null || request.role() == null || request.active() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rol y estado son obligatorios");
        String names = text(request.names());
        String lastnames = text(request.lastnames());
        String email = text(request.username());
        if (email.length() > 254 || !email.matches("^[^\\s@]+@[^\\s@.]+(?:\\.[^\\s@.]+)+$"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingresa un correo válido");
        String password = request.password();
        if (password == null || password.isBlank() || password.length() < 12
            || password.getBytes(StandardCharsets.UTF_8).length > 72)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña debe tener al menos 12 caracteres y máximo 72 bytes");
        users.lockAccounts();
        if (users.existsByUsernameIgnoreCase(email))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya pertenece a otra cuenta");
        User account = User.builder().names(names).lastnames(lastnames).username(email)
            .password(passwordEncoder.encode(password)).role(request.role())
            .active(request.active()).credentialsVersion(0L).build();
        try {
            return AdminUserService.Account.from(users.saveAndFlush(account));
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo no está disponible", ex);
        }
    }

    private String text(String value) {
        if (value == null || value.isBlank() || value.strip().length() > 255)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completa los campos con hasta 255 caracteres");
        return value.strip();
    }
}
