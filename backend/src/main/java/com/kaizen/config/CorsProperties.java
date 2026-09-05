package com.kaizen.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * The frontend runs on its own origin — that is the point of the split — so
 * every browser call is cross-origin and has to be allowed by name here.
 */
@ConfigurationProperties(prefix = "kaizen.cors")
public record CorsProperties(List<String> allowedOrigins) {
}
