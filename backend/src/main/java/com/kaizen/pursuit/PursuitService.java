package com.kaizen.pursuit;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kaizen.common.ApiException;
import com.kaizen.pursuit.dto.ContributeRequest;
import com.kaizen.pursuit.dto.NewPursuitRequest;
import com.kaizen.pursuit.dto.NewStepRequest;
import com.kaizen.pursuit.dto.PursuitResponse;
import com.kaizen.pursuit.dto.StepResponse;
import com.kaizen.pursuit.dto.UpdateStepRequest;

/**
 * The rules the in-memory {@code PursuitsProvider} used to hold. They live here
 * now because a client-side check is a courtesy and this one is the guarantee.
 */
@Service
public class PursuitService {

    private final PursuitRepository repo;

    public PursuitService(PursuitRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public List<PursuitResponse> list(Long userId, PursuitArea area) {
        return repo.findByUserIdAndAreaOrderByCreatedAtDescIdDesc(userId, area).stream()
                .map(PursuitResponse::of)
                .toList();
    }

    @Transactional
    public PursuitResponse add(Long userId, PursuitArea area, NewPursuitRequest request) {
        String name = request.name().trim();
        if (name.isEmpty()) {
            throw ApiException.badRequest("Give it a name.");
        }
        if (name.length() > Pursuit.NAME_MAX) {
            throw ApiException.badRequest("Keep the name to " + Pursuit.NAME_MAX + " characters.");
        }
        // Unique within its own area only - a "House" dream and a "House"
        // savings goal are the same thing seen from two pages.
        if (repo.existsByUserIdAndAreaAndName(userId, area, name)) {
            throw ApiException.conflict("You already have one with that name.");
        }
        if (request.targetAt().isBefore(request.createdAt())) {
            throw ApiException.badRequest("The target date is before the start date.");
        }

        Pursuit pursuit = new Pursuit(userId, area, name, request.createdAt(), request.targetAt());
        pursuit.setKind(kindFor(area, request.kind()));
        pursuit.setIcon(iconFor(area, request.icon()));
        pursuit.setImage(imageFor(request.image()));

        if (area.isMoney()) {
            pursuit.setTarget(amount(request.target(), "target"));
            pursuit.setSaved(amount(request.saved(), "starting balance"));
        } else if (request.target() != null || request.saved() != null) {
            // A bench press has no price.
            throw ApiException.badRequest("Goals on this page do not carry amounts.");
        }

        return PursuitResponse.of(repo.save(pursuit));
    }

    @Transactional
    public void remove(Long userId, Long id) {
        repo.delete(require(userId, id));
    }

    @Transactional
    public StepResponse addStep(Long userId, Long pursuitId, NewStepRequest request) {
        Pursuit pursuit = require(userId, pursuitId);

        String label = request.label().trim();
        if (label.isEmpty()) {
            throw ApiException.badRequest("Describe the step first.");
        }
        if (label.length() > PursuitStep.LABEL_MAX) {
            throw ApiException.badRequest("Keep it to " + PursuitStep.LABEL_MAX + " characters.");
        }
        boolean taken = pursuit.getSteps().stream()
                .anyMatch(step -> step.getLabel().equalsIgnoreCase(label));
        if (taken) {
            throw ApiException.conflict("That step is already on the list.");
        }

        PursuitStep step = new PursuitStep(pursuit, label, pursuit.getSteps().size());
        pursuit.getSteps().add(step);
        repo.flush();
        return StepResponse.of(step);
    }

    /** No {@code done} in the body flips the step, which is what the card wants. */
    @Transactional
    public StepResponse updateStep(Long userId, Long pursuitId, Long stepId, UpdateStepRequest request) {
        PursuitStep step = step(require(userId, pursuitId), stepId);
        step.setDone(request.done() == null ? !step.isDone() : request.done());
        return StepResponse.of(step);
    }

    @Transactional
    public void removeStep(Long userId, Long pursuitId, Long stepId) {
        Pursuit pursuit = require(userId, pursuitId);
        pursuit.getSteps().remove(step(pursuit, stepId));
    }

    /**
     * Moves money in or out. The balance clamps at zero, and overshooting a
     * target is allowed - putting aside more than you meant to is a real thing
     * that happens, not an error.
     */
    @Transactional
    public PursuitResponse contribute(Long userId, Long pursuitId, ContributeRequest request) {
        Pursuit pursuit = require(userId, pursuitId);
        if (!pursuit.getArea().isMoney()) {
            throw ApiException.badRequest("Goals on this page do not carry amounts.");
        }

        BigDecimal delta = request.amount();
        if (delta.signum() == 0) {
            throw ApiException.badRequest("Enter an amount.");
        }
        if (delta.abs().compareTo(Pursuit.MAX_AMOUNT) > 0) {
            throw ApiException.badRequest("That amount is too large.");
        }

        BigDecimal next = (pursuit.getSaved() == null ? BigDecimal.ZERO : pursuit.getSaved()).add(delta);
        pursuit.setSaved(next.max(BigDecimal.ZERO));
        return PursuitResponse.of(pursuit);
    }

    private Pursuit require(Long userId, Long id) {
        return repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("No such goal."));
    }

    private static PursuitStep step(Pursuit pursuit, Long stepId) {
        return pursuit.getSteps().stream()
                .filter(candidate -> candidate.getId().equals(stepId))
                .findFirst()
                .orElseThrow(() -> ApiException.notFound("No such step."));
    }

    /** Kinds are a closed list per area, and areas without kinds take none. */
    private static String kindFor(PursuitArea area, String raw) {
        String kind = raw == null ? null : raw.trim().toLowerCase(Locale.ROOT);

        if (!area.hasKinds()) {
            if (kind != null && !kind.isEmpty()) {
                throw ApiException.badRequest("Goals on this page have no kinds.");
            }
            return null;
        }
        if (kind == null || kind.isEmpty()) {
            throw ApiException.badRequest("Say what kind it is.");
        }
        if (!area.kinds().contains(kind)) {
            throw ApiException.badRequest("That is not one of the kinds on this page.");
        }
        return kind;
    }

    /**
     * Areas with no kinds identify a pursuit by its icon, and it is required:
     * it is the fallback shown when there is no image and when one fails to
     * load, so a dead link degrades instead of leaving a hole in the grid.
     */
    private static String iconFor(PursuitArea area, String raw) {
        if (area.hasKinds()) {
            return null;
        }
        String icon = raw == null ? "" : raw.trim();
        if (icon.isEmpty()) {
            throw ApiException.badRequest("Pick an icon.");
        }
        return icon;
    }

    /**
     * https only, re-checked here rather than trusted from the client. The
     * value is rendered into an {@code <img src>} and nowhere else - the scheme
     * check is what makes that safe, and an href or a CSS url() would void it.
     */
    private static String imageFor(String raw) {
        String value = raw == null ? "" : raw.trim();
        if (value.isEmpty()) {
            return null;
        }
        try {
            URI url = new URI(value);
            if (!"https".equalsIgnoreCase(url.getScheme()) || url.getHost() == null) {
                throw ApiException.badRequest("Use an https:// address for the image.");
            }
            return url.toASCIIString();
        } catch (URISyntaxException ex) {
            throw ApiException.badRequest("Use an https:// address for the image.");
        }
    }

    private static BigDecimal amount(BigDecimal value, String what) {
        if (value == null) {
            return null;
        }
        if (value.signum() < 0) {
            throw ApiException.badRequest("Amounts have to be zero or more.");
        }
        if (value.compareTo(Pursuit.MAX_AMOUNT) > 0) {
            throw ApiException.badRequest("That " + what + " is too large.");
        }
        return value;
    }
}
