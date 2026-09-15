package com.kaizen.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Locale;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.kaizen.common.ApiException;
import com.kaizen.config.JwtProperties;
import com.kaizen.profile.ProfileService;
import com.kaizen.security.JwtService;
import com.kaizen.user.dto.ChangePasswordRequest;
import com.kaizen.user.dto.LoginRequest;
import com.kaizen.user.dto.RegisterRequest;

/**
 * The rules in AuthService that need no database: what a login costs when the
 * account is missing, where a password stops, and how an email folds.
 */
class AuthServiceTest {

    private static final String MISSING_ACCOUNT_HASH = "hash-of-nothing";

    private final UserRepository users = mock(UserRepository.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private AuthService auth;

    @BeforeEach
    void setUp() {
        when(encoder.encode(anyString())).thenReturn(MISSING_ACCOUNT_HASH);
        JwtService jwt = new JwtService(new JwtProperties("test-secret-that-is-long-enough-for-hs256", 3600, "kaizen"));
        auth = new AuthService(users, encoder, jwt, mock(ProfileService.class));
    }

    @Test
    void aMissingAccountStillPaysForAPasswordComparison() {
        when(users.findByEmail("nobody@kaizen.app")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> auth.login(new LoginRequest("nobody@kaizen.app", "correct-horse")))
                .isInstanceOf(ApiException.class);

        verify(encoder).matches("correct-horse", MISSING_ACCOUNT_HASH);
    }

    @Test
    void aMissingAccountAndAWrongPasswordGetTheSameAnswer() {
        when(users.findByEmail("me@kaizen.app")).thenReturn(Optional.of(existingUser()));
        when(users.findByEmail("nobody@kaizen.app")).thenReturn(Optional.empty());

        ApiException wrongPassword = (ApiException) catchThrowable(
                () -> auth.login(new LoginRequest("me@kaizen.app", "wrong-password")));
        ApiException missingAccount = (ApiException) catchThrowable(
                () -> auth.login(new LoginRequest("nobody@kaizen.app", "wrong-password")));

        assertThat(missingAccount.status()).isEqualTo(HttpStatus.UNAUTHORIZED).isEqualTo(wrongPassword.status());
        assertThat(missingAccount.getMessage()).isEqualTo(wrongPassword.getMessage());
    }

    @Test
    void aPasswordPastWhatBcryptReadsIsRefusedAtRegister() {
        // 25 euro signs: 25 characters but 75 bytes, and bytes are what count.
        String tooLong = "€".repeat(25);

        assertThatThrownBy(() -> auth.register(new RegisterRequest("Nikola", "me@kaizen.app", tooLong)))
                .isInstanceOf(ApiException.class)
                .hasMessage("That password is too long.");

        verify(encoder, never()).encode(tooLong);
    }

    @Test
    void aPasswordOfExactlyTheLimitIsStored() {
        String longest = "a".repeat(User.PASSWORD_MAX_BYTES);
        when(users.save(any(User.class))).thenAnswer(call -> call.getArgument(0));

        auth.register(new RegisterRequest("Nikola", "me@kaizen.app", longest));

        verify(encoder).encode(longest);
    }

    @Test
    void aLoginPasswordLongerThanAnyStoredOneNeverMatches() {
        when(users.findByEmail("me@kaizen.app")).thenReturn(Optional.of(existingUser()));
        // BCrypt itself would say yes if the first 72 bytes were the real password.
        when(encoder.matches(anyString(), anyString())).thenReturn(true);

        assertThatThrownBy(() -> auth.login(new LoginRequest("me@kaizen.app", "a".repeat(73))))
                .isInstanceOf(ApiException.class)
                .hasMessage("That email and password don't match.");
    }

    @Test
    void aCurrentPasswordLongerThanAnyStoredOneNeverMatches() {
        when(users.findById(1L)).thenReturn(Optional.of(existingUser()));
        when(encoder.matches(anyString(), anyString())).thenReturn(true);

        assertThatThrownBy(() -> auth.changePassword(1L,
                new ChangePasswordRequest("a".repeat(73), "new-password-1", "new-password-1")))
                .isInstanceOf(ApiException.class)
                .hasMessage("That is not your current password.");
    }

    @Test
    void emailsFoldTheSameWhateverTheServerLocale() {
        Locale original = Locale.getDefault();
        Locale.setDefault(Locale.forLanguageTag("tr-TR"));
        try {
            when(users.existsByEmail(anyString())).thenReturn(true);

            assertThatThrownBy(() -> auth.register(new RegisterRequest("Ilker", " ILKER@KAIZEN.APP ", "correct-horse")))
                    .isInstanceOf(ApiException.class);

            verify(users).existsByEmail("ilker@kaizen.app");
        } finally {
            Locale.setDefault(original);
        }
    }

    private static User existingUser() {
        return new User("Nikola", "me@kaizen.app", "stored-hash");
    }
}
