package com.kaizen.common;

/** Every non-2xx body is this shape, so the client has one thing to read. */
public record ApiError(String error) {
}
