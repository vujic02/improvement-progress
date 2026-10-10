package com.kaizen.routine;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
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

import com.kaizen.routine.dto.RoutineRequest;
import com.kaizen.routine.dto.RoutineResponse;

/**
 * Recurring tasks. Writes take the client's {@code today}, because an edit or
 * a removal reaches into today's copy and the day turns over where the user
 * is. Without it the server's date is used.
 */
@RestController
@RequestMapping("/api/routines")
public class RoutineController {

    private final RoutineService service;

    public RoutineController(RoutineService service) {
        this.service = service;
    }

    @GetMapping
    public List<RoutineResponse> list(@AuthenticationPrincipal Long userId) {
        return service.list(userId);
    }

    @PostMapping
    public RoutineResponse add(@AuthenticationPrincipal Long userId, @RequestBody RoutineRequest request,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate today) {
        return service.add(userId, request, today);
    }

    /** The whole form, like create. Today's untouched copy follows it. */
    @PatchMapping("/{id}")
    public RoutineResponse update(@AuthenticationPrincipal Long userId, @PathVariable Long id,
            @RequestBody RoutineRequest request,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate today) {
        return service.update(userId, id, request, today);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@AuthenticationPrincipal Long userId, @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate today) {
        service.remove(userId, id, today);
        return ResponseEntity.noContent().build();
    }
}
