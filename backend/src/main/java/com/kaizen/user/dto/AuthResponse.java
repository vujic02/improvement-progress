package com.kaizen.user.dto;

/**
 * What register and login return. `expiresIn` is seconds, so the client can
 * decide when to send the user back to the sign-in screen without decoding
 * the token itself.
 */
public record AuthResponse(String token, long expiresIn, UserResponse user) {
}
