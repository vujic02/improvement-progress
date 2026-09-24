package com.kaizen.daytask;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
 * The day tracker over HTTP: what a day holds, what a checkbox does, what one
 * account can see of another's, and what deleting a task type takes with it.
 *
 * <p>Same properties as ApiWiringTest, so all three share one application
 * context - and one rate limiter, which is why each test registers from its own
 * address.
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
class DayTaskFlowTest {

    private static final AtomicInteger NEXT_ADDRESS = new AtomicInteger(1);

    @Autowired
    private MockMvc mvc;

    private final String address = "203.0.113." + NEXT_ADDRESS.getAndIncrement();

    @Test
    void aTaskIsStoredAndReadBackForItsOwnDay() throws Exception {
        String token = register("day-store@kaizen.app");

        add(token, "2026-03-04", "deep", "Ship the tracker layout")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.typeId").value("deep"))
                .andExpect(jsonPath("$.day").value("2026-03-04"))
                .andExpect(jsonPath("$.done").value(false));

        list(token, "2026-03-04", "2026-03-04")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].label").value("Ship the tracker layout"));

        // The day either side is a different day.
        list(token, "2026-03-05", "2026-03-05").andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void patchingWithoutABodyFlipsDone() throws Exception {
        String token = register("day-toggle@kaizen.app");
        String id = idOf(add(token, "2026-03-04", "gym", "Push session"));

        toggle(token, id).andExpect(status().isOk()).andExpect(jsonPath("$.done").value(true));
        toggle(token, id).andExpect(status().isOk()).andExpect(jsonPath("$.done").value(false));

        mvc.perform(patch("/api/day-tasks/" + id)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"done":true,"label":"Push session - 45 min"}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.done").value(true))
                .andExpect(jsonPath("$.label").value("Push session - 45 min"));
    }

    @Test
    void aTaskBelongsToOneAccountOnly() throws Exception {
        String mine = register("day-mine@kaizen.app");
        String theirs = register("day-theirs@kaizen.app");
        String id = idOf(add(mine, "2026-03-04", "learn", "Read 20 pages"));

        list(theirs, "2026-03-04", "2026-03-04").andExpect(jsonPath("$.length()").value(0));
        toggle(theirs, id).andExpect(status().isNotFound());
        mvc.perform(delete("/api/day-tasks/" + id).header("Authorization", "Bearer " + theirs))
                .andExpect(status().isNotFound());

        // Still there, and still untouched.
        list(mine, "2026-03-04", "2026-03-04")
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].done").value(false));
    }

    @Test
    void aTypeTheAccountCannotUseIsRefused() throws Exception {
        String mine = register("day-types@kaizen.app");
        String theirs = register("day-types-other@kaizen.app");
        String theirType = idOf(addType(theirs, "Language practice"));

        add(mine, "2026-03-04", "not-a-type", "Something")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("No such task type."));
        add(mine, "2026-03-04", theirType, "Something")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("No such task type."));
    }

    @Test
    void aDateOutsideTheTrackerIsRefused() throws Exception {
        String token = register("day-dates@kaizen.app");

        add(token, "1999-12-31", "deep", "Long ago")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("That date is outside the tracker."));

        list(token, "2026-03-04", "2026-03-03")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("The range ends before it starts."));
    }

    @Test
    void deletingACustomTypeDeletesTheTasksLoggedAgainstIt() throws Exception {
        String token = register("day-cascade@kaizen.app");
        String typeId = idOf(addType(token, "Language practice"));

        add(token, "2026-03-04", typeId, "Twenty minutes of Italian").andExpect(status().isOk());
        add(token, "2026-03-04", "deep", "Ship the tracker layout").andExpect(status().isOk());
        list(token, "2026-03-04", "2026-03-04").andExpect(jsonPath("$.length()").value(2));

        mvc.perform(delete("/api/task-types/" + typeId).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        // The custom type's task goes with it; the built-in one stays.
        list(token, "2026-03-04", "2026-03-04")
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].typeId").value("deep"));
    }

    private ResultActions add(String token, String day, String typeId, String label) throws Exception {
        return mvc.perform(post("/api/day-tasks")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"day":"%s","typeId":"%s","label":"%s"}
                        """.formatted(day, typeId, label)));
    }

    private ResultActions addType(String token, String label) throws Exception {
        return mvc.perform(post("/api/task-types")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"label":"%s","icon":"book"}
                        """.formatted(label)));
    }

    private ResultActions list(String token, String from, String to) throws Exception {
        return mvc.perform(get("/api/day-tasks?from=%s&to=%s".formatted(from, to))
                .header("Authorization", "Bearer " + token));
    }

    private ResultActions toggle(String token, String id) throws Exception {
        return mvc.perform(patch("/api/day-tasks/" + id).header("Authorization", "Bearer " + token));
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
