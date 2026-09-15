package com.kaizen.user;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kaizen.user.dto.AuthResponse;
import com.kaizen.user.dto.LoginRequest;
import com.kaizen.user.dto.RegisterRequest;
import com.kaizen.user.dto.UserResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * Register and login are the only endpoints open without a token. Both are
 * rate limited per client address — behind a reverse proxy that address is
 * the proxy's unless forwarded headers are trusted (see README).
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request, HttpServletRequest http) {
        return service.register(request, http.getRemoteAddr());
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        return service.login(request, http.getRemoteAddr());
    }

    /** Who the bearer token belongs to. The client calls this on a cold load. */
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal Long userId) {
        return service.read(userId);
    }
}
