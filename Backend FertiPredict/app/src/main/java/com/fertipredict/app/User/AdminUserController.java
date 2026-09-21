package com.fertipredict.app.User;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    private final AdminUserService service;
    @PutMapping("/{id}/access") public AdminUserService.Account access(@PathVariable Long id, @RequestBody AdminUserService.AccessChange change) {
        return service.updateAccess(id, change);
    }
    @PutMapping("/{id}/role") public AdminUserService.Account role(@PathVariable Long id, @RequestBody AdminUserService.RoleChange change) {
        return service.updateRole(id, change);
    }
    @GetMapping public List<AdminUserService.Account> list() { return service.list(); }
    @PutMapping("/{id}") public AdminUserService.Account update(@PathVariable Long id, @RequestBody AdminUserService.Change change) {
        return service.update(id, change);
    }
}
