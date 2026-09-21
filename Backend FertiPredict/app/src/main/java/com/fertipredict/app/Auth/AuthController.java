package com.fertipredict.app.Auth;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.RequestBody;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;

    @org.springframework.web.bind.annotation.ExceptionHandler(org.springframework.security.authentication.DisabledException.class)
    public ResponseEntity<java.util.Map<String, String>> disabled() {
        return ResponseEntity.status(403).body(java.util.Map.of("code", "ACCOUNT_DISABLED", "message", "Cuenta desactivada. Contacta con un administrador."));
    }
    
    @PostMapping(value = "login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request)
    {
        return  ResponseEntity.ok(authService.login(request));
    }
    
    @PostMapping(value = "register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request)
    {
        return ResponseEntity.ok(authService.register(request));
    }
}
