package com.amith.taskmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// login/refresh response body. The tokens go out as httpOnly cookies, not here — this is
// just the username/role the SPA needs to render.
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String username;
    private String role;
}
