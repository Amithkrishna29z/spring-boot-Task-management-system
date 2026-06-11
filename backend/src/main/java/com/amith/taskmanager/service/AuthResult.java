package com.amith.taskmanager.service;

// Internal carrier: the new tokens + the identity to return. The controller turns the
// tokens into cookies, so the service layer doesn't touch servlet stuff.
public record AuthResult(String accessToken, String refreshToken, String username, String role) {
}
