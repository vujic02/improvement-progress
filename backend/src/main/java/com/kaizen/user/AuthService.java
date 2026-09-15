package com.kaizen.user;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

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

    /**
     * The hash of a random value nobody knows. Login compares against it when
     * no account has the email, so a miss costs the same BCrypt round as a
     * wrong password.
     */
    private final String missingAccountHash;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt, ProfileService profiles) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.profiles = profiles;
        this.missingAccountHash = encoder.encode(UUID.randomUUID().toString());
    }

    /**
     * Creates the account and, in the same transaction, its profile settings
     * and the eight default reminders — so every later read finds rows there.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (tooLong(request.password())) {
            throw ApiException.badRequest("That password is too long.");
        }

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
     * them apart tells an attacker which emails are registered. So would
     * answering a missing account faster, which is why the password is
     * compared either way.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        Optional<User> user = users.findByEmail(normalise(request.email()));
        boolean matches = passwordMatches(request.password(),
                user.map(User::getPasswordHash).orElse(missingAccountHash));

        if (user.isEmpty() || !matches) {
            throw ApiException.unauthorized("That email and password don't match.");
        }
        return token(user.get());
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

        if (!passwordMatches(request.current(), user.getPasswordHash())) {
            throw ApiException.badRequest("That is not your current password.");
        }
        if (request.password().length() < User.PASSWORD_MIN) {
            throw ApiException.badRequest("Use at least " + User.PASSWORD_MIN + " characters.");
        }
        if (tooLong(request.password())) {
            throw ApiException.badRequest("That password is too long.");
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

    /**
     * BCrypt's matches() silently ignores everything past 72 bytes, so a
     * stored 72-byte password would also accept itself plus any suffix.
     * Nothing that long can be stored, so nothing that long may match.
     */
    private boolean passwordMatches(String raw, String hash) {
        return !tooLong(raw) && encoder.matches(raw, hash);
    }

    /** Counted in bytes, not characters, because bytes are what BCrypt reads. */
    private static boolean tooLong(String password) {
        return password.getBytes(StandardCharsets.UTF_8).length > User.PASSWORD_MAX_BYTES;
    }

    /** Emails are stored lowercase so the unique index and lookups agree. */
    private static String normalise(String email) {
        // Locale.ROOT: under a Turkish default locale "I" would become a dotless "ı".
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
