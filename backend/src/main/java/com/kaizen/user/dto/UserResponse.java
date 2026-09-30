package com.kaizen.user.dto;

import com.kaizen.user.User;

/**
 * The account as the client sees it. No hash, ever.
 *
 * @param currency ISO code money goals are shown in — on every page, which is
 *                 why it rides on the account rather than the profile.
 */
public record UserResponse(Long id, String name, String email, String currency) {

    public static UserResponse of(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getCurrency().name());
    }
}
