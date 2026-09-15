package com.kaizen.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.jayway.jsonpath.JsonPath;

/**
 * Signing in as a browser lives it: over HTTP, through the security filter,
 * against an in-memory database. What a token is good for, what retires it,
 * and what login does when someone keeps guessing.
 *
 * <p>Same properties as ApiWiringTest, so both share one application context —
 * and one rate limiter, which is why every test here arrives from its own
 * address and uses its own emails.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:kaizen;DB_CLOSE_DELAY=-1;MODE=MySQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.flyway.enabled=false",
        "kaizen.jwt.secret=test-secret-that-is-long-enough-for-hs256"
})
class AuthFlowTest {

    private static final AtomicInteger NEXT_ADDRESS = new AtomicInteger(1);

    @Autowired
    private MockMvc mvc;

    private final String address = "198.51.100." + NEXT_ADDRESS.getAndIncrement();

    @Test
    void aTokenWorksUntilThePasswordChangesAndTheFreshOneTakesOver() throws Exception {
        String oldToken = register("flow-password@kaizen.app", "first-password");
        me(oldToken).andExpect(status().isOk()).andExpect(jsonPath("$.email").value("flow-password@kaizen.app"));

        String newToken = token(mvc.perform(post("/api/account/password")
                .header("Authorization", "Bearer " + oldToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"current":"first-password","password":"second-password","confirm":"second-password"}
                        """))
                .andExpect(status().isOk())
                .andReturn());

        me(oldToken).andExpect(status().isUnauthorized());
        me(newToken).andExpect(status().isOk());
        login("flow-password@kaizen.app", "first-password").andExpect(status().isUnauthorized());
        login("flow-password@kaizen.app", "second-password").andExpect(status().isOk());
    }

    @Test
    void signingOutEverywhereRetiresTheToken() throws Exception {
        String token = register("flow-everywhere@kaizen.app", "correct-horse");

        mvc.perform(post("/api/account/sign-out-everywhere").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        me(token).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Sign in to continue."));
    }

    @Test
    void aGarbageTokenIsTreatedAsNoToken() throws Exception {
        me("not.a.token").andExpect(status().isUnauthorized());
    }

    @Test
    void loginIgnoresEmailCaseAndNeverSaysWhichHalfWasWrong() throws Exception {
        register("flow-case@kaizen.app", "correct-horse");

        login("FLOW-CASE@KAIZEN.APP", "correct-horse").andExpect(status().isOk());

        String wrongPassword = login("flow-case@kaizen.app", "wrong-horse")
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        String noSuchAccount = login("flow-nobody@kaizen.app", "wrong-horse")
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        assertThat(noSuchAccount).isEqualTo(wrongPassword);
    }

    @Test
    void aSecondAccountOnTheSameEmailIsAConflict() throws Exception {
        register("flow-twice@kaizen.app", "correct-horse");

        mvc.perform(post("/api/auth/register")
                .with(from(address))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"Someone","email":"FLOW-TWICE@kaizen.app","password":"another-horse"}
                        """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("That email is already registered."));
    }

    @Test
    void changingTheEmailNeedsThePassword() throws Exception {
        String token = register("flow-move@kaizen.app", "correct-horse");

        account(token, """
                {"name":"Nikola","email":"flow-moved@kaizen.app"}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Enter your current password to change your email."));

        account(token, """
                {"name":"Nikola","email":"Flow-Moved@Kaizen.app","password":"correct-horse"}
                """)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("flow-moved@kaizen.app"));
    }

    @Test
    void loginMakesAGuesserWaitAfterFiveWrongPasswords() throws Exception {
        register("flow-guessed@kaizen.app", "correct-horse");

        for (int attempt = 0; attempt < 5; attempt++) {
            login("flow-guessed@kaizen.app", "wrong-horse").andExpect(status().isUnauthorized());
        }

        // Even the right password waits, or the sixth guess would still tell a hit from a miss.
        login("flow-guessed@kaizen.app", "correct-horse")
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error").value("Too many attempts. Try again in 15 minutes."));
    }

    private String register(String email, String password) throws Exception {
        return token(mvc.perform(post("/api/auth/register")
                .with(from(address))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"Nikola","email":"%s","password":"%s"}
                        """.formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn());
    }

    private ResultActions login(String email, String password) throws Exception {
        return mvc.perform(post("/api/auth/login")
                .with(from(address))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email":"%s","password":"%s"}
                        """.formatted(email, password)));
    }

    private ResultActions me(String token) throws Exception {
        return mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token));
    }

    private ResultActions account(String token, String body) throws Exception {
        return mvc.perform(patch("/api/account")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private static String token(MvcResult result) throws Exception {
        return JsonPath.read(result.getResponse().getContentAsString(), "$.token");
    }

    private static RequestPostProcessor from(String address) {
        return request -> {
            request.setRemoteAddr(address);
            return request;
        };
    }
}
