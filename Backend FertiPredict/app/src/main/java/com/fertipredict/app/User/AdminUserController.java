package com.fertipredict.app.User;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    private final AdminUserService service;
    private final AdminAccountCreationService creationService;
    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public AdminUserService.Account create(@RequestBody AdminAccountCreationService.Request request) {
        return creationService.create(request);
    }
    @PutMapping("/{id}/access") public AdminUserService.Account access(@PathVariable Long id, @RequestBody AdminUserService.AccessChange change) {
        return service.updateAccess(id, change);
    }
    @PutMapping("/{id}/role") public AdminUserService.Account role(@PathVariable Long id, @RequestBody AdminUserService.RoleChange change) {
        return service.updateRole(id, change);
    }
    @PutMapping("/{id}/profile") public AdminUserService.Account profile(@PathVariable Long id, @RequestBody AdminUserService.ProfileChange change) {
        return service.updateProfile(id, change);
    }
    @DeleteMapping("/{id}")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { service.delete(id); }
    @GetMapping public List<AdminUserService.Account> list() { return service.list(); }
    @PutMapping("/{id}") public AdminUserService.Account update(@PathVariable Long id, @RequestBody AdminUserService.Change change) {
        return service.update(id, change);
    }
}
