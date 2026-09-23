package com.kaizen.daytask;

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

import com.kaizen.daytask.dto.DayTaskResponse;
import com.kaizen.daytask.dto.NewDayTaskRequest;
import com.kaizen.daytask.dto.UpdateDayTaskRequest;

import jakarta.validation.Valid;

/**
 * The day tracker. One date range in, the tasks for it out - a day for today's
 * list, seven for the week view, a month for the habit grid.
 */
@RestController
@RequestMapping("/api/day-tasks")
public class DayTaskController {

    private final DayTaskService service;

    public DayTaskController(DayTaskService service) {
        this.service = service;
    }

    @GetMapping
    public List<DayTaskResponse> list(@AuthenticationPrincipal Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.list(userId, from, to);
    }

    @PostMapping
    public DayTaskResponse add(@AuthenticationPrincipal Long userId,
            @Valid @RequestBody NewDayTaskRequest request) {
        return service.add(userId, request);
    }

    @PatchMapping("/{id}")
    public DayTaskResponse update(@AuthenticationPrincipal Long userId, @PathVariable Long id,
            @RequestBody(required = false) UpdateDayTaskRequest request) {
        return service.update(userId, id, request != null ? request : new UpdateDayTaskRequest(null, null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        service.remove(userId, id);
        return ResponseEntity.noContent().build();
    }
}
