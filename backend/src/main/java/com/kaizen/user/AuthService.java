package com.kaizen.user;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kaizen.common.ApiException;
import com.kaizen.profile.ProfileService;
import com.kaizen.security.AttemptLimiter;
import com.kaizen.security.JwtService;
import com.kaizen.user.dto.AuthResponse;
import com.kaizen.user.dto.ChangePasswordRequest;
import com.kaizen.user.dto.LoginRequest;
import com.kaizen.user.dto.RegisterRequest;
import com.kaizen.user.dto.UpdateAccountRequest;
import com.kaizen.user.dto.UserResponse;

@Service
public class AuthService {

    /** Wrong passwords one address may try against one email before login makes it wait. */
    private static final int LOGIN_FAILURES_ALLOWED = 5;
    private static final Duration LOGIN_FAILURE_WINDOW = Duration.ofMinutes(15);

    /** Accounts one address may try to create before register makes it wait. */
    private static final int REGISTRATIONS_ALLOWED = 10;
    private static final Duration REGISTRATION_WINDOW = Duration.ofHours(1);

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

    private final AttemptLimiter loginFailures =
            new AttemptLimiter(LOGIN_FAILURES_ALLOWED, LOGIN_FAILURE_WINDOW, Clock.systemUTC());
    private final AttemptLimiter registrations =
            new AttemptLimiter(REGISTRATIONS_ALLOWED, REGISTRATION_WINDOW, Clock.systemUTC());

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
     * Every attempt counts toward the address's allowance, successful or not.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request, String clientAddress) {
        refuseWhileLimited(registrations, clientAddress);
        registrations.record(clientAddress);

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
     *
     * <p>Failures count per address and email together, so someone guessing
     * at an account cannot lock its owner out from somewhere else. The
     * trade-off is that each new address starts with a fresh allowance.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request, String clientAddress) {
        String email = normalise(request.email());
        String attemptKey = clientAddress + " " + email;
        refuseWhileLimited(loginFailures, attemptKey);

        Optional<User> user = users.findByEmail(email);
        boolean matches = passwordMatches(request.password(),
                user.map(User::getPasswordHash).orElse(missingAccountHash));

        if (user.isEmpty() || !matches) {
            loginFailures.record(attemptKey);
            throw ApiException.unauthorized("That email and password don't match.");
        }
        loginFailures.reset(attemptKey);
        return token(user.get());
    }

    @Transactional(readOnly = true)
    public UserResponse read(Long userId) {
        return UserResponse.of(require(userId));
    }

    /**
     * A new email needs the current password: a stolen token alone must not
     * be enough to move the account to an address someone else controls. The
     * password is checked before the address, so this cannot be used to find
     * out which emails are registered without it.
     */
    @Transactional
    public UserResponse updateAccount(Long userId, UpdateAccountRequest request) {
        User user = require(userId);
        String email = normalise(request.email());

        if (!email.equals(user.getEmail())) {
            if (request.password() == null || request.password().isEmpty()) {
                throw ApiException.badRequest("Enter your current password to change your email.");
            }
            if (!passwordMatches(request.password(), user.getPasswordHash())) {
                throw ApiException.badRequest("That is not your current password.");
            }
            if (users.existsByEmail(email)) {
                throw ApiException.conflict("That email is already registered.");
            }
        }

        user.setName(request.name().trim());
        user.setEmail(email);
        return UserResponse.of(user);
    }

    /**
     * A success means the hash actually changed. It also retires every token
     * issued so far, so a session on another device ends with the old
     * password; the caller gets a fresh token to carry on with.
     */
    @Transactional
    public AuthResponse changePassword(Long userId, ChangePasswordRequest request) {
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
        user.revokeTokens();
        return token(user);
    }

    /** Retires every token issued for the account, the caller's own included. */
    @Transactional
    public void signOutEverywhere(Long userId) {
        require(userId).revokeTokens();
    }

    private User require(Long userId) {
        return users.findById(userId).orElseThrow(() -> ApiException.unauthorized("Sign in to continue."));
    }

    private AuthResponse token(User user) {
        return new AuthResponse(jwt.issue(user.getId(), user.getTokenVersion()), jwt.ttlSeconds(),
                UserResponse.of(user));
    }

    private static void refuseWhileLimited(AttemptLimiter limiter, String key) {
        long seconds = limiter.secondsUntilAllowed(key);
        if (seconds > 0) {
            long minutes = (seconds + 59) / 60;
            throw ApiException.tooManyRequests(
                    "Too many attempts. Try again in " + minutes + (minutes == 1 ? " minute." : " minutes."));
        }
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
