package com.fertipredict.app.User;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AdminUserService {
    private final UserRepository users;
    private final CurrentUser currentUser;
    public record Account(Long id, String username, String names, String lastnames, Role role, boolean active, java.time.Instant lastLoginAt) {
        static Account from(User u) { return new Account(u.getId(), u.getUsername(), u.getNames(), u.getLastnames(), u.getRole(), u.isEnabled(), u.getLastLoginAt()); }
    }
    public record ProfileChange(String names, String lastnames, String username) {}
    @Transactional
    public Account updateProfile(Long id, ProfileChange change) {
        requireAdmin();
        users.lockAccounts();
        User target = users.lockById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (target.getRole() != Role.USER)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo se pueden editar los datos de médicos especialistas");
        if (change == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        String names = requiredText(change.names());
        String lastnames = requiredText(change.lastnames());
        String email = requiredText(change.username());
        if (email.length() > 254 || !email.matches("^[^\\s@]+@[^\\s@.]+(?:\\.[^\\s@.]+)+$"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingresa un correo válido");
        if (users.existsByUsernameIgnoreCaseAndIdNot(email, id))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya pertenece a otra cuenta");
        if (!email.equals(target.getUsername())) {
            target.setCredentialsVersion((target.getCredentialsVersion() == null ? 0L : target.getCredentialsVersion()) + 1);
            target.setResetTokenHash(null);
            target.setResetTokenExpiresAt(null);
            target.setResetRequestedAt(null);
        }
        target.setNames(names);
        target.setLastnames(lastnames);
        target.setUsername(email);
        try {
            return Account.from(users.saveAndFlush(target));
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo no está disponible", ex);
        }
    }
    private String requiredText(String value) {
        if (value == null || value.isBlank() || value.strip().length() > 255)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completa los datos con hasta 255 caracteres");
        return value.strip();
    }
    public record Change(Role role, Boolean active) {}
    public record AccessChange(Boolean active) {}
    public record RoleChange(Role role) {}
    @Transactional
    public Account updateAccess(Long id, AccessChange change) {
        users.lockAccounts();
        requireAdmin();
        if (change.active() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El estado es obligatorio");
        User target = users.lockById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return update(id, new Change(target.getRole(), change.active()));
    }
    @Transactional
    public Account updateRole(Long id, RoleChange change) {
        users.lockAccounts();
        requireAdmin();
        if (change.role() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El rol es obligatorio");
        User target = users.lockById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return update(id, new Change(change.role(), target.isEnabled()));
    }
    private User requireAdmin() {
        User actor = currentUser.get();
        if (actor.getRole() != Role.ADMIN) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return actor;
    }
    public List<Account> list() {
        requireAdmin();
        return users.findAll(org.springframework.data.domain.Sort.by("id")).stream().map(Account::from).toList();
    }
    @Transactional
    public Account update(Long id, Change change) {
        users.lockAccounts();
        User actor = requireAdmin();
        if (change.role() == null || change.active() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rol y estado son obligatorios");
        // Self changes cannot remove the last active administrator, including concurrent requests.
        if (actor.getId().equals(id) && (change.role() != Role.ADMIN || !change.active()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No puedes quitarte el rol de administrador ni desactivar tu propia cuenta");
        User target = users.lockById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (target.isEnabled() != change.active()) {
            target.setCredentialsVersion((target.getCredentialsVersion() == null ? 0L : target.getCredentialsVersion()) + 1);
        }
        target.setRole(change.role());
        target.setActive(change.active());
        return Account.from(users.save(target));
    }
}
