package com.kaizen.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;

import com.kaizen.config.JwtProperties;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * The one piece of security logic worth testing without a database: everything
 * else in the API is authorised by the claims this hands back.
 */
class JwtServiceTest {

    private static final String SECRET = "test-secret-that-is-long-enough-for-hs256";

    private final JwtService jwt = new JwtService(new JwtProperties(SECRET, 3600, "kaizen"));

    @Test
    void readsBackTheUserAndVersionItIssuedFor() {
        String token = jwt.issue(42L, 3);

        assertThat(jwt.read(token)).isEqualTo(new JwtService.TokenClaims(42L, 3));
    }

    @Test
    void rejectsATokenSignedWithADifferentKey() {
        JwtService other = new JwtService(new JwtProperties("a-completely-different-secret-key-x", 3600, "kaizen"));

        assertThat(jwt.read(other.issue(42L, 0))).isNull();
    }

    @Test
    void rejectsATokenFromAnotherIssuer() {
        JwtService other = new JwtService(new JwtProperties(SECRET, 3600, "somebody-else"));

        assertThat(jwt.read(other.issue(42L, 0))).isNull();
    }

    @Test
    void rejectsAnExpiredToken() throws InterruptedException {
        JwtService instant = new JwtService(new JwtProperties(SECRET, 0, "kaizen"));
        String token = instant.issue(42L, 0);
        // jjwt allows no clock skew by default, but the expiry it just stamped
        // is this second - wait past it rather than race the second boundary.
        Thread.sleep(1100);

        assertThat(jwt.read(token)).isNull();
    }

    @Test
    void rejectsATokenWithoutAVersion() {
        // What every token issued before token versions existed looks like.
        String unversioned = Jwts.builder()
                .subject("42")
                .issuer("kaizen")
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
                .compact();

        assertThat(jwt.read(unversioned)).isNull();
    }

    @Test
    void rejectsSomethingThatIsNotAToken() {
        assertThat(jwt.read("not.a.token")).isNull();
        assertThat(jwt.read("")).isNull();
    }

    @Test
    void refusesToStartWithoutASecret() {
        // What application.yml binds when JWT_SECRET is unset outside the dev profile.
        assertThatThrownBy(() -> new JwtService(new JwtProperties("", 3600, "kaizen")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    void refusesToStartWithAKeyTooShortForHs256() {
        assertThatThrownBy(() -> new JwtService(new JwtProperties("too-short", 3600, "kaizen")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 bytes");
    }
}
