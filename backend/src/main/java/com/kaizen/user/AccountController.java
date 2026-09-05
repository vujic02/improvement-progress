package com.kaizen.user;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kaizen.user.dto.ChangePasswordRequest;
import com.kaizen.user.dto.UpdateAccountRequest;
import com.kaizen.user.dto.UserResponse;

import jakarta.validation.Valid;

/** The Account tab of `#/profile`. */
@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final AuthService service;

    public AccountController(AuthService service) {
        this.service = service;
    }

    @PatchMapping
    public UserResponse update(@AuthenticationPrincipal Long userId,
            @Valid @RequestBody UpdateAccountRequest request) {
        return service.updateAccount(userId, request);
    }

    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal Long userId,
            @Valid @RequestBody ChangePasswordRequest request) {
        service.changePassword(userId, request);
        return ResponseEntity.noContent().build();
    }
}
