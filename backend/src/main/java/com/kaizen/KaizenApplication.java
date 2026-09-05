package com.kaizen;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * The Kaizen API. JSON in, JSON out — it serves no HTML and no static assets.
 * The Vite app in ../frontend is a separate deployment and talks to this over
 * /api with a bearer token.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class KaizenApplication {
    public static void main(String[] args) {
        SpringApplication.run(KaizenApplication.class, args);
    }
}
