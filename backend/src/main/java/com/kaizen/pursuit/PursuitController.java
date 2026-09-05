package com.kaizen.pursuit;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kaizen.pursuit.dto.ContributeRequest;
import com.kaizen.pursuit.dto.NewPursuitRequest;
import com.kaizen.pursuit.dto.NewStepRequest;
import com.kaizen.pursuit.dto.PursuitResponse;
import com.kaizen.pursuit.dto.StepResponse;
import com.kaizen.pursuit.dto.UpdateStepRequest;

import jakarta.validation.Valid;

/**
 * All three pursuit pages. {@code area} is savings, growth or dreams - the
 * lists never see each other, so it is required on read and on create.
 *
 * <p>Everything below /{id} finds the pursuit by id and owner alone: the area
 * is already fixed by the row, and repeating it in the path would only give
 * the client a way to contradict itself.
 */
@RestController
@RequestMapping("/api/pursuits")
public class PursuitController {

    private final PursuitService service;

    public PursuitController(PursuitService service) {
        this.service = service;
    }

    @GetMapping
    public List<PursuitResponse> list(@AuthenticationPrincipal Long userId, @RequestParam PursuitArea area) {
        return service.list(userId, area);
    }

    @PostMapping
    public PursuitResponse add(@AuthenticationPrincipal Long userId, @RequestParam PursuitArea area,
            @Valid @RequestBody NewPursuitRequest request) {
        return service.add(userId, area, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        service.remove(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/steps")
    public StepResponse addStep(@AuthenticationPrincipal Long userId, @PathVariable Long id,
            @Valid @RequestBody NewStepRequest request) {
        return service.addStep(userId, id, request);
    }

    /** An empty body flips the step; {@code {"done": true}} sets it outright. */
    @PatchMapping("/{id}/steps/{stepId}")
    public StepResponse updateStep(@AuthenticationPrincipal Long userId, @PathVariable Long id,
            @PathVariable Long stepId, @RequestBody(required = false) UpdateStepRequest request) {
        return service.updateStep(userId, id, stepId,
                request == null ? new UpdateStepRequest(null) : request);
    }

    @DeleteMapping("/{id}/steps/{stepId}")
    public ResponseEntity<Void> removeStep(@AuthenticationPrincipal Long userId, @PathVariable Long id,
            @PathVariable Long stepId) {
        service.removeStep(userId, id, stepId);
        return ResponseEntity.noContent().build();
    }

    /** Savings only. Adds a delta to the balance and returns the whole goal. */
    @PostMapping("/{id}/contributions")
    public PursuitResponse contribute(@AuthenticationPrincipal Long userId, @PathVariable Long id,
            @Valid @RequestBody ContributeRequest request) {
        return service.contribute(userId, id, request);
    }
}
