package com.kaizen.tasktype;

import org.springframework.stereotype.Component;

import com.kaizen.common.ApiException;

/**
 * Turns the one type string the client sends into the two columns it is
 * stored in: a built-in's key as it is, or the id of a custom type this
 * account owns. Day tasks and routines both name a type this way.
 */
@Component
public class TaskTypeResolver {

    /** Exactly one of the two is set. */
    public record Ref(Long customTypeId, String defaultKey) {
    }

    private final CustomTaskTypeRepository types;

    public TaskTypeResolver(CustomTaskTypeRepository types) {
        this.types = types;
    }

    /**
     * Anything that is not a built-in or one of this account's own types -
     * another account's type, a deleted one, a typo - is a bad request rather
     * than a row pointing nowhere.
     */
    public Ref resolve(Long userId, String typeId) {
        String value = typeId == null ? "" : typeId.trim();
        if (value.isEmpty()) {
            throw ApiException.badRequest("Pick a task type.");
        }
        if (TaskTypeDefaults.isDefaultKey(value)) {
            return new Ref(null, value);
        }

        long customId;
        try {
            customId = Long.parseLong(value);
        } catch (NumberFormatException e) {
            throw ApiException.badRequest("No such task type.");
        }
        types.findByIdAndUserId(customId, userId)
                .orElseThrow(() -> ApiException.badRequest("No such task type."));
        return new Ref(customId, null);
    }
}
