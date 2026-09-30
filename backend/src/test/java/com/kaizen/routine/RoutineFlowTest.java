package com.kaizen.routine;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.jayway.jsonpath.JsonPath;

/**
 * Recurring tasks over HTTP: what a read fills in, what it never puts back,
 * and how an edit or a removal reaches into today.
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
class RoutineFlowTest {

    private static final AtomicInteger NEXT_ADDRESS = new AtomicInteger(1);

    @Autowired
    private MockMvc mvc;

    @Autowired
    private RoutineRepository routines;

    private final String address = "192.0.2." + NEXT_ADDRESS.getAndIncrement();

    private final LocalDate today = LocalDate.now();

    @Test
    void aReadFillsInTodayOnceAndADeletedCopyStaysDeleted() throws Exception {
        String token = register("routine-today@kaizen.app");
        String routine = idOf(add(token, """
                {"label":"Read 20 pages","typeId":"learn","cadence":"daily"}
                """).andExpect(status().isOk())
                .andExpect(jsonPath("$.cadence").value("daily"))
                .andExpect(jsonPath("$.startsOn").value(today.toString())));

        days(token, today, today)
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].label").value("Read 20 pages"))
                .andExpect(jsonPath("$[0].typeId").value("learn"))
                .andExpect(jsonPath("$[0].routineId").value(routine))
                .andExpect(jsonPath("$[0].done").value(false));
        // A second read does not fill the day again.
        String copy = JsonPath.read(days(token, today, today)
                .andExpect(jsonPath("$.length()").value(1))
                .andReturn().getResponse().getContentAsString(), "$[0].id");

        mvc.perform(delete("/api/day-tasks/" + copy).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
        days(token, today, today).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void missedDaysAreFilledInUntickedButNoFurtherThanTheBackfillWindow() throws Exception {
        String token = register("routine-backfill@kaizen.app");
        Long userId = userId(token);

        Routine recent = new Routine(userId, today.minusDays(4));
        recent.setType(null, "gym");
        recent.setLabel("Mobility");
        recent.setSchedule(RoutineCadence.DAILY, 0, null, null);
        routines.save(recent);

        Routine old = new Routine(userId, today.minusDays(200));
        old.setType(null, "mind");
        old.setLabel("Journal");
        old.setSchedule(RoutineCadence.DAILY, 0, null, null);
        routines.save(old);

        // Four days back plus today, all unticked.
        days(token, today.minusDays(4), today)
                .andExpect(jsonPath("$[?(@.label == 'Mobility')]", hasSize(5)))
                .andExpect(jsonPath("$[?(@.done == true)]").isEmpty());
        // The old one stops at the window instead of filling 200 days.
        days(token, today.minusDays(300), today)
                .andExpect(jsonPath("$[?(@.label == 'Journal')]", hasSize(RoutineService.BACKFILL_DAYS)));
        // Nothing is filled ahead of today.
        days(token, today.plusDays(1), today.plusDays(7)).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void anEditRewritesTodaysUntouchedCopyAndLeavesATouchedOneAlone() throws Exception {
        String token = register("routine-edit@kaizen.app");
        String untouched = idOf(add(token, """
                {"label":"Stretch","typeId":"gym","cadence":"daily"}
                """));
        String ticked = idOf(add(token, """
                {"label":"Walk","typeId":"gym","cadence":"daily"}
                """));
        String renamed = idOf(add(token, """
                {"label":"Water","typeId":"food","cadence":"daily"}
                """));
        String response = days(token, today, today).andReturn().getResponse().getContentAsString();
        String tickedCopy = copyOf(response, ticked);
        String renamedCopy = copyOf(response, renamed);

        mvc.perform(patch("/api/day-tasks/" + tickedCopy).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mvc.perform(patch("/api/day-tasks/" + renamedCopy)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"label":"Two litres of water"}
                        """))
                .andExpect(status().isOk());

        for (String id : new String[] {untouched, ticked, renamed}) {
            update(token, id, """
                    {"label":"Changed","typeId":"deep","cadence":"daily"}
                    """).andExpect(status().isOk());
        }

        days(token, today, today)
                .andExpect(jsonPath("$[?(@.routineId == '%s')].label".formatted(untouched)).value("Changed"))
                .andExpect(jsonPath("$[?(@.routineId == '%s')].typeId".formatted(untouched)).value("deep"))
                .andExpect(jsonPath("$[?(@.routineId == '%s')].label".formatted(ticked)).value("Walk"))
                .andExpect(jsonPath("$[?(@.routineId == '%s')].label".formatted(renamed))
                        .value("Two litres of water"));
    }

    @Test
    void anEditThatDropsTodayTakesTodaysUntouchedCopyWithIt() throws Exception {
        String token = register("routine-reschedule@kaizen.app");
        String id = idOf(add(token, """
                {"label":"Gym","typeId":"gym","cadence":"daily"}
                """));
        days(token, today, today).andExpect(jsonPath("$.length()").value(1));

        int tomorrow = (Routine.sundayFirst(today.getDayOfWeek()) + 1) % 7;
        update(token, id, """
                {"label":"Gym","typeId":"gym","cadence":"weekly","weekdays":[%d]}
                """.formatted(tomorrow))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weekdays[0]").value(tomorrow));

        days(token, today, today).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void removingARoutineKeepsItsTouchedCopiesAsPlainTasks() throws Exception {
        String token = register("routine-remove@kaizen.app");
        String keep = idOf(add(token, """
                {"label":"Walk","typeId":"gym","cadence":"daily"}
                """));
        String drop = idOf(add(token, """
                {"label":"Stretch","typeId":"gym","cadence":"daily"}
                """));
        String response = days(token, today, today).andReturn().getResponse().getContentAsString();
        mvc.perform(patch("/api/day-tasks/" + copyOf(response, keep)).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        for (String id : new String[] {keep, drop}) {
            mvc.perform(delete("/api/routines/" + id + "?today=" + today)
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isNoContent());
        }

        mvc.perform(get("/api/routines").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.length()").value(0));
        days(token, today, today)
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].label").value("Walk"))
                .andExpect(jsonPath("$[0].done").value(true))
                .andExpect(jsonPath("$[0].routineId").doesNotExist());
    }

    @Test
    void aScheduleMustSayEverythingItsCadenceNeeds() throws Exception {
        String token = register("routine-invalid@kaizen.app");

        add(token, """
                {"label":"Gym","typeId":"gym","cadence":"weekly"}
                """).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Pick at least one day of the week."));
        add(token, """
                {"label":"Gym","typeId":"gym","cadence":"weekly","weekdays":[7]}
                """).andExpect(status().isBadRequest());
        add(token, """
                {"label":"Rent","typeId":"money","cadence":"month-day","dayOfMonth":32}
                """).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Pick a day of the month from 1 to 31."));
        add(token, """
                {"label":"Plants","typeId":"deep","cadence":"every-n-days","interval":1}
                """).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Repeat every 2 to 365 days."));
        add(token, """
                {"label":"Review","typeId":"deep","cadence":"every-n-weeks","interval":2}
                """).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Pick at least one day of the week."));
        add(token, """
                {"label":"Gym","typeId":"gym","cadence":"hourly"}
                """).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Pick how often it repeats."));
        add(token, """
                {"label":"Gym","typeId":"not-a-type","cadence":"daily"}
                """).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("No such task type."));

        mvc.perform(post("/api/routines?today=" + today.plusDays(5))
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"label":"Gym","typeId":"gym","cadence":"daily"}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Your device's date looks wrong."));

        mvc.perform(get("/api/routines").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void deletingACustomTypeTakesItsRoutines() throws Exception {
        String token = register("routine-type@kaizen.app");
        String typeId = JsonPath.read(mvc.perform(post("/api/task-types")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"label":"Language practice","icon":"book"}
                        """))
                .andReturn().getResponse().getContentAsString(), "$.id");
        add(token, """
                {"label":"Italian","typeId":"%s","cadence":"daily"}
                """.formatted(typeId)).andExpect(status().isOk());

        mvc.perform(delete("/api/task-types/" + typeId).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/routines").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.length()").value(0));
        days(token, today, today).andExpect(jsonPath("$.length()").value(0));
    }

    private ResultActions add(String token, String body) throws Exception {
        return mvc.perform(post("/api/routines?today=" + today)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private ResultActions update(String token, String id, String body) throws Exception {
        return mvc.perform(patch("/api/routines/" + id + "?today=" + today)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private ResultActions days(String token, LocalDate from, LocalDate to) throws Exception {
        return mvc.perform(get("/api/day-tasks?from=%s&to=%s&today=%s".formatted(from, to, today))
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    /** The id of the copy a routine left in a day-tasks response. */
    private static String copyOf(String response, String routineId) {
        net.minidev.json.JSONArray ids = JsonPath.read(response, "$[?(@.routineId == '%s')].id".formatted(routineId));
        return (String) ids.get(0);
    }

    private Long userId(String token) throws Exception {
        Number id = JsonPath.read(mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andReturn().getResponse().getContentAsString(), "$.id");
        return id.longValue();
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
