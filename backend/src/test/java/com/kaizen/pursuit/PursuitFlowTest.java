package com.kaizen.pursuit;

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
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.jayway.jsonpath.JsonPath;

/**
 * Editing a pursuit over HTTP: what an edit may change, what it may not, and
 * that a rejected one leaves the goal as it was.
 *
 * <p>Same properties as ApiWiringTest, so they share one application context -
 * and one rate limiter, which is why each test registers from its own address.
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
class PursuitFlowTest {

    private static final AtomicInteger NEXT_ADDRESS = new AtomicInteger(1);

    @Autowired
    private MockMvc mvc;

    private final String address = "198.51.100." + NEXT_ADDRESS.getAndIncrement();

    @Test
    void anEditRewritesTheFormButKeepsTheBalanceAndSteps() throws Exception {
        String token = register("pursuit-edit@kaizen.app");
        String id = idOf(create(token, "savings", """
                {"name":"Emergency fund","kind":"saving","target":5000,"saved":250,
                 "createdAt":"2026-01-01","targetAt":"2026-12-31"}
                """));
        mvc.perform(post("/api/pursuits/" + id + "/steps")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"label":"Open the account"}
                        """))
                .andExpect(status().isOk());

        update(token, id, """
                {"name":"Rainy day fund","kind":"investment","target":8000,
                 "createdAt":"2025-11-01","targetAt":"2027-06-30"}
                """)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.name").value("Rainy day fund"))
                .andExpect(jsonPath("$.kind").value("investment"))
                .andExpect(jsonPath("$.target").value(8000))
                .andExpect(jsonPath("$.createdAt").value("2025-11-01"))
                .andExpect(jsonPath("$.targetAt").value("2027-06-30"))
                // Only contributions move the balance; steps have their own endpoints.
                .andExpect(jsonPath("$.saved").value(250))
                .andExpect(jsonPath("$.steps.length()").value(1));

        list(token, "savings")
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Rainy day fund"));
    }

    @Test
    void aBlankOptionalFieldClearsIt() throws Exception {
        String token = register("pursuit-clear@kaizen.app");
        String dream = idOf(create(token, "dreams", """
                {"name":"Cabin","icon":"home","image":"https://example.com/cabin.jpg",
                 "createdAt":"2026-01-01","targetAt":"2030-01-01"}
                """));
        String saving = idOf(create(token, "savings", """
                {"name":"Car","kind":"saving","target":12000,
                 "createdAt":"2026-01-01","targetAt":"2027-01-01"}
                """));

        update(token, dream, """
                {"name":"Cabin","icon":"star","image":"",
                 "createdAt":"2026-01-01","targetAt":"2030-01-01"}
                """)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.icon").value("star"))
                .andExpect(jsonPath("$.image").doesNotExist());

        update(token, saving, """
                {"name":"Car","kind":"saving",
                 "createdAt":"2026-01-01","targetAt":"2027-01-01"}
                """)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.target").doesNotExist());
    }

    @Test
    void keepingItsOwnNameIsNotAClashButTakingAnothersIs() throws Exception {
        String token = register("pursuit-names@kaizen.app");
        String bench = idOf(create(token, "growth", """
                {"name":"Bench 100kg","kind":"training","createdAt":"2026-01-01","targetAt":"2026-12-31"}
                """));
        create(token, "growth", """
                {"name":"Read 20 books","kind":"reading","createdAt":"2026-01-01","targetAt":"2026-12-31"}
                """);
        // The same name on another page is a different list.
        create(token, "dreams", """
                {"name":"Marathon","icon":"star","createdAt":"2026-01-01","targetAt":"2028-01-01"}
                """);

        update(token, bench, """
                {"name":"Bench 100kg","kind":"training","createdAt":"2026-02-01","targetAt":"2026-12-31"}
                """)
                .andExpect(status().isOk());

        update(token, bench, """
                {"name":"read 20 BOOKS","kind":"training","createdAt":"2026-02-01","targetAt":"2026-12-31"}
                """)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("You already have one with that name."));

        update(token, bench, """
                {"name":"Marathon","kind":"training","createdAt":"2026-02-01","targetAt":"2026-12-31"}
                """)
                .andExpect(status().isOk());
    }

    @Test
    void aRejectedEditLeavesTheGoalAsItWas() throws Exception {
        String token = register("pursuit-reject@kaizen.app");
        String id = idOf(create(token, "growth", """
                {"name":"Learn Italian","kind":"learning","createdAt":"2026-01-01","targetAt":"2026-12-31"}
                """));

        update(token, id, """
                {"name":"Learn Spanish","kind":"learning","createdAt":"2026-06-01","targetAt":"2026-01-01"}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("The target date is before the start date."));
        update(token, id, """
                {"name":"Learn Spanish","kind":"not-a-kind","createdAt":"2026-01-01","targetAt":"2026-12-31"}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("That is not one of the kinds on this page."));
        update(token, id, """
                {"name":"Learn Spanish","kind":"learning","target":100,
                 "createdAt":"2026-01-01","targetAt":"2026-12-31"}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Goals on this page do not carry amounts."));
        update(token, id, """
                {"name":"   ","kind":"learning","createdAt":"2026-01-01","targetAt":"2026-12-31"}
                """)
                .andExpect(status().isBadRequest());

        list(token, "growth")
                .andExpect(jsonPath("$[0].name").value("Learn Italian"))
                .andExpect(jsonPath("$[0].createdAt").value("2026-01-01"));
    }

    @Test
    void aDreamStillNeedsAnIconAndAnHttpsImage() throws Exception {
        String token = register("pursuit-dream@kaizen.app");
        String id = idOf(create(token, "dreams", """
                {"name":"Sabbatical","icon":"star","createdAt":"2026-01-01","targetAt":"2028-01-01"}
                """));

        update(token, id, """
                {"name":"Sabbatical","icon":"","createdAt":"2026-01-01","targetAt":"2028-01-01"}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Pick an icon."));
        update(token, id, """
                {"name":"Sabbatical","icon":"star","image":"http://example.com/beach.jpg",
                 "createdAt":"2026-01-01","targetAt":"2028-01-01"}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Use an https:// address for the image."));
    }

    @Test
    void anotherAccountCannotEditIt() throws Exception {
        String mine = register("pursuit-mine@kaizen.app");
        String theirs = register("pursuit-theirs@kaizen.app");
        String id = idOf(create(mine, "growth", """
                {"name":"Run 10k","kind":"training","createdAt":"2026-01-01","targetAt":"2026-12-31"}
                """));

        update(theirs, id, """
                {"name":"Hijacked","kind":"training","createdAt":"2026-01-01","targetAt":"2026-12-31"}
                """)
                .andExpect(status().isNotFound());

        list(mine, "growth").andExpect(jsonPath("$[0].name").value("Run 10k"));
    }

    private ResultActions create(String token, String area, String body) throws Exception {
        return mvc.perform(post("/api/pursuits?area=" + area)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isOk());
    }

    private ResultActions update(String token, String id, String body) throws Exception {
        return mvc.perform(patch("/api/pursuits/" + id)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private ResultActions list(String token, String area) throws Exception {
        return mvc.perform(get("/api/pursuits?area=" + area).header("Authorization", "Bearer " + token));
    }

    private String register(String email) throws Exception {
        return JsonPath.read(mvc.perform(post("/api/auth/register")
                .with(from(address))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"Nikola","email":"%s","password":"correct-horse"}
                        """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(), "$.token");
    }

    private static String idOf(ResultActions actions) throws Exception {
        return JsonPath.read(actions.andReturn().getResponse().getContentAsString(), "$.id");
    }

    private static RequestPostProcessor from(String address) {
        return request -> {
            request.setRemoteAddr(address);
            return request;
        };
    }
}
