package com.kaizen.tasktype;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kaizen.common.ApiException;
import com.kaizen.tasktype.dto.NewTaskTypeRequest;
import com.kaizen.tasktype.dto.TaskTypeResponse;

@Service
public class TaskTypeService {

    private final CustomTaskTypeRepository repo;

    public TaskTypeService(CustomTaskTypeRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public List<TaskTypeResponse> list(Long userId) {
        return repo.findByUserIdOrderByIdAsc(userId).stream().map(TaskTypeResponse::of).toList();
    }

    @Transactional
    public TaskTypeResponse add(Long userId, NewTaskTypeRequest request) {
        String label = request.label().trim();
        if (label.isEmpty()) {
            throw ApiException.badRequest("Give the type a name.");
        }
        if (label.length() > TaskTypeDefaults.NAME_MAX) {
            throw ApiException.badRequest("Keep it to " + TaskTypeDefaults.NAME_MAX + " characters.");
        }
        // Unique against the 12 built-ins as well as the user's own.
        if (TaskTypeDefaults.isDefaultLabel(label) || repo.existsByUserIdAndLabel(userId, label)) {
            throw ApiException.conflict("You already have a type with that name.");
        }

        long used = repo.countByUserId(userId);
        if (used >= TaskTypeDefaults.CUSTOM_LIMIT) {
            throw ApiException.conflict(
                    "You can add " + TaskTypeDefaults.CUSTOM_LIMIT + " types. Remove one first.");
        }

        // No colour picker yet: take the next colour and wrap around. Keyed on
        // how many exist, so a removal frees its colour along with its slot.
        String color = TaskTypeDefaults.CUSTOM_COLORS.get((int) (used % TaskTypeDefaults.CUSTOM_COLORS.size()));

        return TaskTypeResponse.of(repo.save(new CustomTaskType(userId, label, request.icon().trim(), color)));
    }

    @Transactional
    public void remove(Long userId, Long id) {
        CustomTaskType type = repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("No such task type."));
        repo.delete(type);
    }
}
