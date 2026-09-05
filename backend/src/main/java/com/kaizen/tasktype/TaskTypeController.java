package com.kaizen.tasktype;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kaizen.tasktype.dto.NewTaskTypeRequest;
import com.kaizen.tasktype.dto.TaskTypeResponse;

import jakarta.validation.Valid;

/**
 * `#/task-types`. Only the user's custom types are served — the 12 defaults
 * ship with the frontend and are not rows.
 */
@RestController
@RequestMapping("/api/task-types")
public class TaskTypeController {

    private final TaskTypeService service;

    public TaskTypeController(TaskTypeService service) {
        this.service = service;
    }

    @GetMapping
    public List<TaskTypeResponse> list(@AuthenticationPrincipal Long userId) {
        return service.list(userId);
    }

    @PostMapping
    public TaskTypeResponse add(@AuthenticationPrincipal Long userId, @Valid @RequestBody NewTaskTypeRequest request) {
        return service.add(userId, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        service.remove(userId, id);
        return ResponseEntity.noContent().build();
    }
}
