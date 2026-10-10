package com.kaizen.routine;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.jayway.jsonpath.JsonPath;

/**
 * Recurring tasks that count toward a goal: what ticking one pays, what
 * unticking takes back, and the record a goal shows for its habits.
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
class GoalLinkFlowTest {

    private static final AtomicInteger NEXT_ADDRESS = new AtomicInteger(1);

    @Autowired
    private MockMvc mvc;

    @Autowired
    private RoutineRepository routines;

    private final String address = "198.18.0." + NEXT_ADDRESS.getAndIncrement();

    private final LocalDate today = LocalDate.now();

    @Test
    void tickingAPaymentRoutineTicksTheGoalsNextStepAndUntickingTakesItBack() throws Exception {
        String token = register("link-step@kaizen.app");
        String goal = goal(token, "savings", """
                {"name":"Holiday","kind":"saving","target":6000,"createdAt":"%s","targetAt":"%s"}
                """.formatted(today, today.plusYears(1)));
        send(token, "/api/pursuits/" + goal + "/steps", """
                {"amount":500,"count":12}
                """).andExpect(status().isOk());
        routine(token, """
                {"label":"Put 500 aside","typeId":"money","cadence":"daily","pursuitId":"%s"}
                """.formatted(goal)).andExpect(jsonPath("$.pursuitId").value(goal));
        String copy = onlyCopy(token);

        toggle(token, copy).andExpect(jsonPath("$.done").value(true));
        pursuits(token, "savings")
                .andExpect(jsonPath("$[0].saved").value(500))
                .andExpect(jsonPath("$[0].steps[0].done").value(true))
                .andExpect(jsonPath("$[0].steps[1].done").value(false));

        toggle(token, copy).andExpect(jsonPath("$.done").value(false));
        pursuits(token, "savings")
                .andExpect(jsonPath("$[0].saved").value(0))
                .andExpect(jsonPath("$[0].steps[0].done").value(false));
    }

    @Test
    void withNoStepLeftATickAddsTheRoutinesOwnAmount() throws Exception {
        String token = register("link-amount@kaizen.app");
        String goal = goal(token, "savings", """
                {"name":"Monthly bills","kind":"bills","createdAt":"%s","targetAt":"%s"}
                """.formatted(today, today.plusYears(1)));
        routine(token, """
                {"label":"Electricity","typeId":"money","cadence":"daily","pursuitId":"%s","amount":120}
                """.formatted(goal)).andExpect(jsonPath("$.amount").value(120));
        String copy = onlyCopy(token);

        toggle(token, copy);
        pursuits(token, "savings").andExpect(jsonPath("$[0].saved").value(120));
        toggle(token, copy);
        pursuits(token, "savings").andExpect(jsonPath("$[0].saved").value(0));
    }

    @Test
    void aGoalShowsItsLinkedHabitsWithTheirRecord() throws Exception {
        String token = register("link-habit@kaizen.app");
        String goal = goal(token, "growth", """
                {"name":"Eat clean all year","kind":"nutrition","createdAt":"%s","targetAt":"%s"}
                """.formatted(today, today.plusYears(1)));
        Long userId = userId(token);

        // Four days of history, set up directly: the API only starts routines today.
        Routine routine = new Routine(userId, today.minusDays(3));
        routine.setType(null, "food");
        routine.setLabel("Eat clean");
        routine.setSchedule(RoutineCadence.DAILY, 0, null, null);
        routine.setGoal(Long.parseLong(goal), null);
        routines.save(routine);

        pursuits(token, "growth")
                .andExpect(jsonPath("$[0].habits[0].routine.label").value("Eat clean"))
                .andExpect(jsonPath("$[0].habits[0].due").value(4))
                .andExpect(jsonPath("$[0].habits[0].done").value(0))
                .andExpect(jsonPath("$[0].habits[0].streak").value(0))
                .andExpect(jsonPath("$[0].habits[0].dueToday").value(true))
                .andExpect(jsonPath("$[0].habits[0].lastMissed").value(today.minusDays(1).toString()));

        // Tick yesterday and the day before: a two-day run, and today still open.
        String days = mvc.perform(get("/api/day-tasks?from=%s&to=%s&today=%s"
                .formatted(today.minusDays(3), today, today)).header("Authorization", "Bearer " + token))
                .andReturn().getResponse().getContentAsString();
        for (int back = 1; back <= 2; back++) {
            String id = JsonPath.<net.minidev.json.JSONArray>read(days,
                    "$[?(@.day == '%s')].id".formatted(today.minusDays(back))).get(0).toString();
            toggle(token, id);
        }

        pursuits(token, "growth")
                .andExpect(jsonPath("$[0].habits[0].done").value(2))
                .andExpect(jsonPath("$[0].habits[0].streak").value(2))
                .andExpect(jsonPath("$[0].habits[0].lastMissed").value(today.minusDays(3).toString()));
    }

    @Test
    void aLinkMustPointAtYourOwnGoalAndOnlyMoneyGoalsTakeAnAmount() throws Exception {
        String token = register("link-invalid@kaizen.app");
        String other = register("link-invalid-other@kaizen.app");
        String growth = goal(token, "growth", """
                {"name":"Upload daily","kind":"creative","createdAt":"%s","targetAt":"%s"}
                """.formatted(today, today.plusYears(1)));
        String theirs = goal(other, "savings", """
                {"name":"Their fund","kind":"saving","createdAt":"%s","targetAt":"%s"}
                """.formatted(today, today.plusYears(1)));

        routine(token, """
                {"label":"Upload a video","typeId":"create","cadence":"daily","pursuitId":"%s","amount":10}
                """.formatted(growth)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Goals on that page do not carry amounts."));
        routine(token, """
                {"label":"Sneaky","typeId":"money","cadence":"daily","pursuitId":"%s"}
                """.formatted(theirs)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("No such goal."));
        routine(token, """
                {"label":"Loose change","typeId":"money","cadence":"daily","amount":5}
                """).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Link a goal for the amount to go to."));
    }

    @Test
    void deletingTheGoalLeavesItsRoutineRunningUnlinked() throws Exception {
        String token = register("link-delete@kaizen.app");
        String goal = goal(token, "savings", """
                {"name":"Rent pot","kind":"bills","createdAt":"%s","targetAt":"%s"}
                """.formatted(today, today.plusYears(1)));
        routine(token, """
                {"label":"Rent","typeId":"money","cadence":"daily","pursuitId":"%s","amount":800}
                """.formatted(goal));
        String copy = onlyCopy(token);
        toggle(token, copy);

        mvc.perform(delete("/api/pursuits/" + goal).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/routines").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$[0].label").value("Rent"))
                .andExpect(jsonPath("$[0].pursuitId").doesNotExist())
                .andExpect(jsonPath("$[0].amount").value(800));
        // Unticking with no goal to refund is harmless.
        toggle(token, copy).andExpect(status().isOk()).andExpect(jsonPath("$.done").value(false));
    }

    @Test
    void aPaymentStepRemovedAfterATickDoesNotBreakTheUntick() throws Exception {
        String token = register("link-step-removed@kaizen.app");
        String goal = goal(token, "savings", """
                {"name":"Index fund","kind":"investment","createdAt":"%s","targetAt":"%s"}
                """.formatted(today, today.plusYears(1)));
        String step = JsonPath.read(send(token, "/api/pursuits/" + goal + "/steps", """
                {"amount":300}
                """).andReturn().getResponse().getContentAsString(), "$.steps[0].id");
        routine(token, """
                {"label":"Invest","typeId":"money","cadence":"daily","pursuitId":"%s"}
                """.formatted(goal));
        String copy = onlyCopy(token);
        toggle(token, copy);

        mvc.perform(delete("/api/pursuits/" + goal + "/steps/" + step).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
        toggle(token, copy).andExpect(status().isOk());
        // The removed step's money stays put, as it does for any removed ticked payment.
        pursuits(token, "savings").andExpect(jsonPath("$[0].saved").value(300));
    }

    private String goal(String token, String area, String body) throws Exception {
        return JsonPath.read(send(token, "/api/pursuits?area=" + area, body)
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(), "$.id");
    }

    private ResultActions routine(String token, String body) throws Exception {
        return send(token, "/api/routines?today=" + today, body);
    }

    private ResultActions send(String token, String path, String body) throws Exception {
        return mvc.perform(MockMvcRequestBuilders.post(path)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private ResultActions pursuits(String token, String area) throws Exception {
        return mvc.perform(get("/api/pursuits?area=%s&today=%s".formatted(area, today))
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    private ResultActions toggle(String token, String id) throws Exception {
        return mvc.perform(patch("/api/day-tasks/" + id).header("Authorization", "Bearer " + token));
    }

    /** Reads today and returns the one copy on it. */
    private String onlyCopy(String token) throws Exception {
        return JsonPath.read(mvc.perform(get("/api/day-tasks?from=%s&to=%s&today=%s".formatted(today, today, today))
                .header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.length()").value(1))
                .andReturn().getResponse().getContentAsString(), "$[0].id");
    }

    private Long userId(String token) throws Exception {
        Number id = JsonPath.read(mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andReturn().getResponse().getContentAsString(), "$.id");
        return id.longValue();
    }

    private String register(String email) throws Exception {
        return JsonPath.read(mvc.perform(MockMvcRequestBuilders.post("/api/auth/register")
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

    private static RequestPostProcessor from(String address) {
        return request -> {
            request.setRemoteAddr(address);
            return request;
        };
    }
}
