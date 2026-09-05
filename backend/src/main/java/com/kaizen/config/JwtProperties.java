package com.kaizen.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param secret     HMAC key. HS256 needs at least 32 bytes; the default in
 *                   application.yml is a development value and nothing else.
 * @param ttlSeconds How long an issued token stays valid.
 * @param issuer     Checked on every token this API accepts.
 */
@ConfigurationProperties(prefix = "kaizen.jwt")
public record JwtProperties(String secret, long ttlSeconds, String issuer) {
}
