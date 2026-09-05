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
 * user id and nothing else — no name, no email, nothing that goes stale or is
 * worth reading off a token someone pasted somewhere.
 */
@Service
public class JwtService {

    /** HS256 will not accept a shorter key, and neither should we. */
    private static final int MIN_SECRET_BYTES = 32;

    private final SecretKey key;
    private final JwtProperties props;

    public JwtService(JwtProperties props) {
        byte[] secret = props.secret().getBytes(StandardCharsets.UTF_8);
        if (secret.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "kaizen.jwt.secret must be at least " + MIN_SECRET_BYTES + " bytes for HS256");
        }
        this.key = Keys.hmacShaKeyFor(secret);
        this.props = props;
    }

    public String issue(Long userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
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
     * The user id inside a valid token, or null for anything expired, forged,
     * issued by someone else, or simply not a token. Callers treat null as
     * "not signed in" — there is no case where the reason matters to them.
     */
    public Long readUserId(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(props.issuer())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Long.valueOf(claims.getSubject());
        } catch (JwtException | IllegalArgumentException ex) {
            return null;
        }
    }
}
