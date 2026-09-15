package com.kaizen.security;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.kaizen.user.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Reads `Authorization: Bearer <token>` and, if it checks out and still carries
 * the account's current token version, puts the user id in the security
 * context as the principal. Controllers pick it up with
 * {@code @AuthenticationPrincipal Long userId}.
 *
 * <p>A missing or bad token is not an error here — the filter simply leaves the
 * context empty and lets the authorization rules decide.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String PREFIX = "Bearer ";

    private final JwtService jwt;
    private final UserRepository users;

    public JwtAuthFilter(JwtService jwt, UserRepository users) {
        this.jwt = jwt;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(PREFIX)
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            JwtService.TokenClaims claims = jwt.read(header.substring(PREFIX.length()).trim());
            if (claims != null && isCurrent(claims)) {
                var auth = new UsernamePasswordAuthenticationToken(claims.userId(), null, List.of());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        chain.doFilter(request, response);
    }

    /**
     * A signature alone is not enough: changing the password or signing out
     * everywhere bumps the account's version and retires every token issued
     * before. A deleted account has no version, so its tokens fail too.
     */
    private boolean isCurrent(JwtService.TokenClaims claims) {
        return users.findTokenVersionById(claims.userId())
                .map(version -> version == claims.version())
                .orElse(false);
    }
}
