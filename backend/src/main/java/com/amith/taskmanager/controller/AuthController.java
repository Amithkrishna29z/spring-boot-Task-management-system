package com.amith.taskmanager.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.amith.taskmanager.dto.AuthResponse;
import com.amith.taskmanager.dto.LoginRequest;
import com.amith.taskmanager.dto.SignupRequest;
import com.amith.taskmanager.exception.InvalidRefreshTokenException;
import com.amith.taskmanager.security.CookieUtils;
import com.amith.taskmanager.service.AuthResult;
import com.amith.taskmanager.service.AuthService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Login, signup, token refresh and logout")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;

    @Autowired
    private CookieUtils cookieUtils;

    @PostMapping("/login")
    @Operation(summary = "Authenticate and receive httpOnly auth cookies")
    public ResponseEntity<AuthResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest,
                                                         HttpServletResponse response) {
        AuthResult result = authService.login(loginRequest);
        setAuthCookies(response, result);
        return ResponseEntity.ok(new AuthResponse(result.username(), result.role()));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate the refresh token and issue a new access token")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = CookieUtils.REFRESH_TOKEN_COOKIE, required = false) String refreshToken,
            HttpServletResponse response) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new InvalidRefreshTokenException("Missing refresh token");
        }
        AuthResult result = authService.refresh(refreshToken);
        setAuthCookies(response, result);
        return ResponseEntity.ok(new AuthResponse(result.username(), result.role()));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke the refresh token and clear auth cookies")
    public ResponseEntity<Void> logout(
            @CookieValue(name = CookieUtils.REFRESH_TOKEN_COOKIE, required = false) String refreshToken,
            HttpServletResponse response) {
        authService.logout(refreshToken);
        response.addHeader(HttpHeaders.SET_COOKIE, cookieUtils.clearAccessTokenCookie().toString());
        response.addHeader(HttpHeaders.SET_COOKIE, cookieUtils.clearRefreshTokenCookie().toString());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/signup")
    @Operation(summary = "Register a new user")
    public ResponseEntity<Map<String, String>> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        String message = authService.register(signUpRequest);
        logger.info("User {} registered successfully", signUpRequest.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", message));
    }

    private void setAuthCookies(HttpServletResponse response, AuthResult result) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookieUtils.accessTokenCookie(result.accessToken()).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, cookieUtils.refreshTokenCookie(result.refreshToken()).toString());
    }
}
