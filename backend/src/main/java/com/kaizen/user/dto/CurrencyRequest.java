package com.kaizen.user.dto;

/**
 * An ISO code from the Currency list. Kept a string so an unknown code gets
 * the service's message naming what is allowed, not a generic parse error.
 */
public record CurrencyRequest(String currency) {
}
