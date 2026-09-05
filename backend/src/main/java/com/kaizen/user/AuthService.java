package com.kaizen.user;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kaizen.common.ApiException;
import com.kaizen.profile.ProfileService;
import com.kaizen.security.JwtService;
import com.kaizen.user.dto.AuthResponse;
import com.kaizen.user.dto.ChangePasswordRequest;
import com.kaizen.user.dto.LoginRequest;
import com.kaizen.user.dto.RegisterRequest;
import com.kaizen.user.dto.UpdateAccountRequest;
import com.kaizen.user.dto.UserResponse;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final ProfileService profiles;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt, ProfileService profiles) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.profiles = profiles;
    }

    /**
     * Creates the account and, in the same transaction, its profile settings
     * and the eight default reminders — so every later read finds rows there.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalise(request.email());
        if (users.existsByEmail(email)) {
            throw ApiException.conflict("That email is already registered.");
        }

        User user = users.save(new User(request.name().trim(), email, encoder.encode(request.password())));
        profiles.seedFor(user.getId());
        return token(user);
    }

    /**
     * One message for a missing account and a wrong password alike: telling
     * them apart tells an attacker which emails are registered.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = users.findByEmail(normalise(request.email()))
                .filter(candidate -> encoder.matches(request.password(), candidate.getPasswordHash()))
                .orElseThrow(() -> ApiException.unauthorized("That email and password don't match."));

        return token(user);
    }

    @Transactional(readOnly = true)
    public UserResponse read(Long userId) {
        return UserResponse.of(require(userId));
    }

    @Transactional
    public UserResponse updateAccount(Long userId, UpdateAccountRequest request) {
        User user = require(userId);
        String email = normalise(request.email());

        if (!email.equals(user.getEmail()) && users.existsByEmail(email)) {
            throw ApiException.conflict("That email is already registered.");
        }

        user.setName(request.name().trim());
        user.setEmail(email);
        return UserResponse.of(user);
    }

    /**
     * Unlike the client-side stand-in this replaces, a success here means the
     * hash actually changed.
     */
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = require(userId);

        if (!encoder.matches(request.current(), user.getPasswordHash())) {
            throw ApiException.badRequest("That is not your current password.");
        }
        if (request.password().length() < User.PASSWORD_MIN) {
            throw ApiException.badRequest("Use at least " + User.PASSWORD_MIN + " characters.");
        }
        if (request.password().equals(request.current())) {
            throw ApiException.badRequest("That is your current password.");
        }
        if (!request.password().equals(request.confirm())) {
            throw ApiException.badRequest("The two new passwords don't match.");
        }

        user.setPasswordHash(encoder.encode(request.password()));
    }

    private User require(Long userId) {
        return users.findById(userId).orElseThrow(() -> ApiException.unauthorized("Sign in to continue."));
    }

    private AuthResponse token(User user) {
        return new AuthResponse(jwt.issue(user.getId()), jwt.ttlSeconds(), UserResponse.of(user));
    }

    /** Emails are stored lowercase so the unique index and lookups agree. */
    private static String normalise(String email) {
        return email.trim().toLowerCase();
    }
}
