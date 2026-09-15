package com.kaizen.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Locale;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.kaizen.common.ApiException;
import com.kaizen.config.JwtProperties;
import com.kaizen.profile.ProfileService;
import com.kaizen.security.JwtService;
import com.kaizen.user.dto.AuthResponse;
import com.kaizen.user.dto.ChangePasswordRequest;
import com.kaizen.user.dto.LoginRequest;
import com.kaizen.user.dto.RegisterRequest;
import com.kaizen.user.dto.UpdateAccountRequest;

/**
 * The rules in AuthService that need no database: what a login costs when the
 * account is missing, where a password stops, how an email folds, when a
 * guesser has to wait, and what retires a token.
 */
class AuthServiceTest {

    private static final String MISSING_ACCOUNT_HASH = "hash-of-nothing";
    private static final String STORED_HASH = "stored-hash";
    private static final String ADDRESS = "203.0.113.7";

    private final UserRepository users = mock(UserRepository.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private final JwtService jwt =
            new JwtService(new JwtProperties("test-secret-that-is-long-enough-for-hs256", 3600, "kaizen"));
    private AuthService auth;

    @BeforeEach
    void setUp() {
        when(encoder.encode(anyString())).thenReturn(MISSING_ACCOUNT_HASH);
        auth = new AuthService(users, encoder, jwt, mock(ProfileService.class));
    }

    @Test
    void aMissingAccountStillPaysForAPasswordComparison() {
        when(users.findByEmail("nobody@kaizen.app")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> auth.login(new LoginRequest("nobody@kaizen.app", "correct-horse"), ADDRESS))
                .isInstanceOf(ApiException.class);

        verify(encoder).matches("correct-horse", MISSING_ACCOUNT_HASH);
    }

    @Test
    void aMissingAccountAndAWrongPasswordGetTheSameAnswer() {
        when(users.findByEmail("me@kaizen.app")).thenReturn(Optional.of(existingUser()));
        when(users.findByEmail("nobody@kaizen.app")).thenReturn(Optional.empty());

        ApiException wrongPassword = (ApiException) catchThrowable(
                () -> auth.login(new LoginRequest("me@kaizen.app", "wrong-password"), ADDRESS));
        ApiException missingAccount = (ApiException) catchThrowable(
                () -> auth.login(new LoginRequest("nobody@kaizen.app", "wrong-password"), ADDRESS));

        assertThat(missingAccount.status()).isEqualTo(HttpStatus.UNAUTHORIZED).isEqualTo(wrongPassword.status());
        assertThat(missingAccount.getMessage()).isEqualTo(wrongPassword.getMessage());
    }

    @Test
    void aPasswordPastWhatBcryptReadsIsRefusedAtRegister() {
        // 25 euro signs: 25 characters but 75 bytes, and bytes are what count.
        String tooLong = "€".repeat(25);

        assertThatThrownBy(() -> auth.register(new RegisterRequest("Nikola", "me@kaizen.app", tooLong), ADDRESS))
                .isInstanceOf(ApiException.class)
                .hasMessage("That password is too long.");

        verify(encoder, never()).encode(tooLong);
    }

    @Test
    void aPasswordOfExactlyTheLimitIsStored() {
        String longest = "a".repeat(User.PASSWORD_MAX_BYTES);
        when(users.save(any(User.class))).thenAnswer(call -> call.getArgument(0));

        auth.register(new RegisterRequest("Nikola", "me@kaizen.app", longest), ADDRESS);

        verify(encoder).encode(longest);
    }

    @Test
    void aLoginPasswordLongerThanAnyStoredOneNeverMatches() {
        when(users.findByEmail("me@kaizen.app")).thenReturn(Optional.of(existingUser()));
        // BCrypt itself would say yes if the first 72 bytes were the real password.
        when(encoder.matches(anyString(), anyString())).thenReturn(true);

        assertThatThrownBy(() -> auth.login(new LoginRequest("me@kaizen.app", "a".repeat(73)), ADDRESS))
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

            assertThatThrownBy(() -> auth.register(
                    new RegisterRequest("Ilker", " ILKER@KAIZEN.APP ", "correct-horse"), ADDRESS))
                    .isInstanceOf(ApiException.class);

            verify(users).existsByEmail("ilker@kaizen.app");
        } finally {
            Locale.setDefault(original);
        }
    }

    @Test
    void loginMakesAGuesserWaitAfterFiveWrongPasswords() {
        when(users.findByEmail("me@kaizen.app")).thenReturn(Optional.of(existingUser()));

        for (int attempt = 0; attempt < 5; attempt++) {
            assertThatThrownBy(() -> auth.login(new LoginRequest("me@kaizen.app", "wrong-password"), ADDRESS))
                    .hasMessage("That email and password don't match.");
        }
        ApiException refused = (ApiException) catchThrowable(
                () -> auth.login(new LoginRequest("me@kaizen.app", "wrong-password"), ADDRESS));

        assertThat(refused.status()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(refused.getMessage()).isEqualTo("Too many attempts. Try again in 15 minutes.");
        // The sixth attempt never reached BCrypt.
        verify(encoder, times(5)).matches(anyString(), anyString());
    }

    @Test
    void anotherAddressKeepsItsOwnAllowance() {
        when(users.findByEmail("me@kaizen.app")).thenReturn(Optional.of(existingUser()));
        for (int attempt = 0; attempt < 5; attempt++) {
            catchThrowable(() -> auth.login(new LoginRequest("me@kaizen.app", "wrong-password"), ADDRESS));
        }

        assertThatThrownBy(() -> auth.login(new LoginRequest("me@kaizen.app", "wrong-password"), "198.51.100.1"))
                .hasMessage("That email and password don't match.");
    }

    @Test
    void aSuccessfulLoginClearsTheCount() {
        when(users.findByEmail("me@kaizen.app")).thenReturn(Optional.of(existingUser()));
        when(encoder.matches("right-password", STORED_HASH)).thenReturn(true);
        for (int attempt = 0; attempt < 4; attempt++) {
            catchThrowable(() -> auth.login(new LoginRequest("me@kaizen.app", "wrong-password"), ADDRESS));
        }

        auth.login(new LoginRequest("me@kaizen.app", "right-password"), ADDRESS);

        // Without the reset, the second of these would already be refused.
        for (int attempt = 0; attempt < 5; attempt++) {
            assertThatThrownBy(() -> auth.login(new LoginRequest("me@kaizen.app", "wrong-password"), ADDRESS))
                    .hasMessage("That email and password don't match.");
        }
    }

    @Test
    void changingThePasswordRetiresEveryEarlierToken() {
        User user = existingUser();
        when(users.findById(1L)).thenReturn(Optional.of(user));
        when(encoder.matches("old-password-1", STORED_HASH)).thenReturn(true);

        AuthResponse response = auth.changePassword(1L,
                new ChangePasswordRequest("old-password-1", "new-password-1", "new-password-1"));

        assertThat(user.getTokenVersion()).isEqualTo(1);
        assertThat(jwt.read(response.token())).isEqualTo(new JwtService.TokenClaims(1L, 1));
    }

    @Test
    void signingOutEverywhereRetiresEveryToken() {
        User user = existingUser();
        when(users.findById(1L)).thenReturn(Optional.of(user));

        auth.signOutEverywhere(1L);

        assertThat(user.getTokenVersion()).isEqualTo(1);
    }

    @Test
    void changingTheEmailNeedsTheCurrentPassword() {
        User user = existingUser();
        when(users.findById(1L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> auth.updateAccount(1L, new UpdateAccountRequest("Nikola", "new@kaizen.app", null)))
                .hasMessage("Enter your current password to change your email.");
        assertThatThrownBy(() -> auth.updateAccount(1L,
                new UpdateAccountRequest("Nikola", "new@kaizen.app", "wrong-password")))
                .hasMessage("That is not your current password.");

        assertThat(user.getEmail()).isEqualTo("me@kaizen.app");
        // Without the password, nobody learns whether the new address is taken.
        verify(users, never()).existsByEmail(anyString());
    }

    @Test
    void renamingOrChangingOnlyTheCaseNeedsNoPassword() {
        User user = existingUser();
        when(users.findById(1L)).thenReturn(Optional.of(user));

        auth.updateAccount(1L, new UpdateAccountRequest("Nikola V", " ME@Kaizen.app ", null));

        assertThat(user.getName()).isEqualTo("Nikola V");
        assertThat(user.getEmail()).isEqualTo("me@kaizen.app");
    }

    private static User existingUser() {
        User user = new User("Nikola", "me@kaizen.app", STORED_HASH);
        ReflectionTestUtils.setField(user, "id", 1L);
        return user;
    }
}
