package com.kaizen.user.dto;

import com.kaizen.user.User;

/** The account as the client sees it. No hash, ever. */
public record UserResponse(Long id, String name, String email) {

    public static UserResponse of(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail());
    }
}
