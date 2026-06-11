package com.amith.taskmanager.model;

public enum Role {
    ROLE_USER,
    ROLE_ADMIN;

    public static Role fromString(String role) {
        if (role == null) {
            return ROLE_USER;
        }
        try {
            return Role.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            return Role.valueOf("ROLE_" + role.toUpperCase());
        }
    }

    public String getAuthority() {
        return name();
    }
}
