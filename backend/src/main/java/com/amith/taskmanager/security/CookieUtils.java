package com.amith.taskmanager.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

// Builds the httpOnly auth cookies. Access token goes on every request ("/"); the refresh
// token is scoped to the auth endpoints so it isn't sent with normal API calls.
@Component
public class CookieUtils {

    public static final String ACCESS_TOKEN_COOKIE = "access_token";
    public static final String REFRESH_TOKEN_COOKIE = "refresh_token";
    private static final String REFRESH_TOKEN_PATH = "/api/v1/auth";

    private final boolean secure;
    private final String sameSite;
    private final long accessExpirationMs;
    private final long refreshExpirationMs;

    public CookieUtils(@Value("${app.cookie.secure}") boolean secure,
                       @Value("${app.cookie.same-site}") String sameSite,
                       @Value("${app.jwt.access-expiration-in-ms}") long accessExpirationMs,
                       @Value("${app.jwt.refresh-expiration-in-ms}") long refreshExpirationMs) {
        this.secure = secure;
        this.sameSite = sameSite;
        this.accessExpirationMs = accessExpirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public ResponseCookie accessTokenCookie(String token) {
        return build(ACCESS_TOKEN_COOKIE, token, "/", Duration.ofMillis(accessExpirationMs));
    }

    public ResponseCookie refreshTokenCookie(String token) {
        return build(REFRESH_TOKEN_COOKIE, token, REFRESH_TOKEN_PATH, Duration.ofMillis(refreshExpirationMs));
    }

    public ResponseCookie clearAccessTokenCookie() {
        return build(ACCESS_TOKEN_COOKIE, "", "/", Duration.ZERO);
    }

    public ResponseCookie clearRefreshTokenCookie() {
        return build(REFRESH_TOKEN_COOKIE, "", REFRESH_TOKEN_PATH, Duration.ZERO);
    }

    private ResponseCookie build(String name, String value, String path, Duration maxAge) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path(path)
                .maxAge(maxAge)
                .build();
    }
}
