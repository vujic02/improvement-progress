package com.kaizen;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Boots the whole application against an in-memory database. It is not testing
 * the behaviour of any one endpoint - it is checking that the context wires at
 * all, that security is on, and that a failure comes back in the one error
 * shape the client is written against.
 *
 * <p>Hibernate builds the schema here; MySQL and Flyway are what run for real.
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
class ApiWiringTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void registerIssuesATokenAndSeedsTheProfile() throws Exception {
        String token = register("wiring@kaizen.app");

        mvc.perform(get("/api/profile").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                // Eight reminder rows exist from the moment the account does.
                .andExpect(jsonPath("$.reminders.length()").value(8))
                .andExpect(jsonPath("$.channels.push").value(true));
    }

    @Test
    void everythingButRegisterAndLoginNeedsAToken() throws Exception {
        mvc.perform(get("/api/task-types"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void aRejectedWriteComesBackAsAnErrorMessage() throws Exception {
        String token = register("rules@kaizen.app");

        // Dreams have no kinds, so sending one is a rule violation and not a 500.
        mvc.perform(post("/api/pursuits?area=dreams")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"A house","kind":"saving","icon":"home",
                         "createdAt":"2026-01-01","targetAt":"2027-01-01"}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Goals on this page have no kinds."));
    }

    @Test
    void aDreamIsStoredAndReadBackFromItsOwnArea() throws Exception {
        String token = register("dreams@kaizen.app");

        mvc.perform(post("/api/pursuits?area=dreams")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"A house","icon":"home","image":"https://example.com/house.jpg",
                         "createdAt":"2026-01-01","targetAt":"2027-01-01"}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.icon").value("home"))
                .andExpect(jsonPath("$.kind").doesNotExist());

        // The areas never see each other's lists.
        mvc.perform(get("/api/pursuits?area=savings").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        mvc.perform(get("/api/pursuits?area=dreams").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void anImageThatIsNotHttpsIsRefusedOnWrite() throws Exception {
        String token = register("images@kaizen.app");

        mvc.perform(post("/api/pursuits?area=dreams")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"A house","icon":"home","image":"http://example.com/house.jpg",
                         "createdAt":"2026-01-01","targetAt":"2027-01-01"}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Use an https:// address for the image."));
    }

    private String register(String email) throws Exception {
        String body = mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"Nikola","email":"%s","password":"correct-horse"}
                        """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return body.replaceAll(".*\"token\"\\s*:\\s*\"([^\"]+)\".*", "$1");
    }
}
