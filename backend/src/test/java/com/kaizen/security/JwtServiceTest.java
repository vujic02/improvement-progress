package com.kaizen.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import com.kaizen.config.JwtProperties;

/**
 * The one piece of security logic worth testing without a database: everything
 * else in the API is authorised by the user id this hands back.
 */
class JwtServiceTest {

    private static final String SECRET = "test-secret-that-is-long-enough-for-hs256";

    private final JwtService jwt = new JwtService(new JwtProperties(SECRET, 3600, "kaizen"));

    @Test
    void readsBackTheUserItIssuedFor() {
        String token = jwt.issue(42L);

        assertThat(jwt.readUserId(token)).isEqualTo(42L);
    }

    @Test
    void rejectsATokenSignedWithADifferentKey() {
        JwtService other = new JwtService(new JwtProperties("a-completely-different-secret-key-x", 3600, "kaizen"));

        assertThat(jwt.readUserId(other.issue(42L))).isNull();
    }

    @Test
    void rejectsATokenFromAnotherIssuer() {
        JwtService other = new JwtService(new JwtProperties(SECRET, 3600, "somebody-else"));

        assertThat(jwt.readUserId(other.issue(42L))).isNull();
    }

    @Test
    void rejectsAnExpiredToken() throws InterruptedException {
        JwtService instant = new JwtService(new JwtProperties(SECRET, 0, "kaizen"));
        String token = instant.issue(42L);
        // jjwt allows no clock skew by default, but the expiry it just stamped
        // is this second - wait past it rather than race the second boundary.
        Thread.sleep(1100);

        assertThat(jwt.readUserId(token)).isNull();
    }

    @Test
    void rejectsSomethingThatIsNotAToken() {
        assertThat(jwt.readUserId("not.a.token")).isNull();
        assertThat(jwt.readUserId("")).isNull();
    }

    @Test
    void refusesToStartWithAKeyTooShortForHs256() {
        assertThatThrownBy(() -> new JwtService(new JwtProperties("too-short", 3600, "kaizen")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 bytes");
    }
}
