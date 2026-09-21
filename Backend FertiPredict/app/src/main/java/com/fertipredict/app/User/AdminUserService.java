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
    public record Account(Long id, String username, String names, String lastnames, Role role, boolean active) {
        static Account from(User u) { return new Account(u.getId(), u.getUsername(), u.getNames(), u.getLastnames(), u.getRole(), u.isEnabled()); }
    }
    public record Change(Role role, Boolean active) {}
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
