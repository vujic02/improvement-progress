package com.kaizen.pursuit.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.kaizen.pursuit.Pursuit;
import com.kaizen.routine.GoalLinks;
import com.kaizen.routine.dto.HabitResponse;
import com.kaizen.routine.dto.RunResponse;

/**
 * Shaped like the client's `Pursuit`. Null fields are dropped from the body,
 * so a growth goal carries no amounts and a dream carries no kind.
 *
 * @param createdAt yyyy-mm-dd. The user-facing start date, not the row's.
 * @param targetAt  yyyy-mm-dd.
 */
public record PursuitResponse(
        String id,
        String name,
        String kind,
        String icon,
        String image,
        BigDecimal target,
        BigDecimal saved,
        LocalDate createdAt,
        LocalDate targetAt,
        List<StepResponse> steps,
        List<HabitResponse> habits,
        List<RunResponse> runs) {

    /**
     * @param linked the recurring tasks linked to it, with their records and
     *               the runs it lists among its steps - every response
     *               carries them, so a card never loses them on a write
     */
    public static PursuitResponse of(Pursuit pursuit, GoalLinks.Linked linked) {
        return new PursuitResponse(
                String.valueOf(pursuit.getId()),
                pursuit.getName(),
                pursuit.getKind(),
                pursuit.getIcon(),
                pursuit.getImage(),
                pursuit.getTarget(),
                pursuit.getSaved(),
                pursuit.getStartedOn(),
                pursuit.getTargetOn(),
                pursuit.getSteps().stream().map(StepResponse::of).toList(),
                linked.habits(),
                linked.runs());
    }
}
