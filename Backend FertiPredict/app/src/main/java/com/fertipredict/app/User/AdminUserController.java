package com.fertipredict.app.User;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    private final AdminUserService service;
    @GetMapping public List<AdminUserService.Account> list() { return service.list(); }
    @PutMapping("/{id}") public AdminUserService.Account update(@PathVariable Long id, @RequestBody AdminUserService.Change change) {
        return service.update(id, change);
    }
}
