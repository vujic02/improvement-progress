package com.kaizen.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.kaizen.config.JwtProperties;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * Issues and verifies the bearer tokens the frontend holds. The subject is the
 * user id and the only other claim is the account's token version — no name,
 * no email, nothing that goes stale or is worth reading off a token someone
 * pasted somewhere.
 */
@Service
public class JwtService {

    /** HS256 will not accept a shorter key, and neither should we. */
    private static final int MIN_SECRET_BYTES = 32;

    /** The account's token version when the token was issued; see {@code User#revokeTokens}. */
    private static final String VERSION_CLAIM = "ver";

    /** What a valid token says about who holds it. */
    public record TokenClaims(Long userId, int version) {
    }

    private final SecretKey key;
    private final JwtProperties props;

    public JwtService(JwtProperties props) {
        if (props.secret() == null || props.secret().isBlank()) {
            throw new IllegalStateException(
                    "kaizen.jwt.secret is not set. Set JWT_SECRET, or run with the dev profile on a laptop.");
        }
        byte[] secret = props.secret().getBytes(StandardCharsets.UTF_8);
        if (secret.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "kaizen.jwt.secret must be at least " + MIN_SECRET_BYTES + " bytes for HS256");
        }
        this.key = Keys.hmacShaKeyFor(secret);
        this.props = props;
    }

    public String issue(Long userId, int tokenVersion) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim(VERSION_CLAIM, tokenVersion)
                .issuer(props.issuer())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(props.ttlSeconds())))
                .signWith(key)
                .compact();
    }

    public long ttlSeconds() {
        return props.ttlSeconds();
    }

    /**
     * The claims inside a valid token, or null for anything expired, forged,
     * issued by someone else, missing its version, or simply not a token.
     * Callers treat null as "not signed in" — there is no case where the
     * reason matters to them.
     */
    public TokenClaims read(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(props.issuer())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            Integer version = claims.get(VERSION_CLAIM, Integer.class);
            if (version == null) {
                return null;
            }
            return new TokenClaims(Long.valueOf(claims.getSubject()), version);
        } catch (JwtException | IllegalArgumentException ex) {
            return null;
        }
    }
}
