package com.amith.taskmanager.controller;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/healthcheck")
public class HealthController {

    @Value("${spring.application.name:TaskManager}")
    private String appName;

    /**
     * GET /api/health
     * Public endpoint — no authentication required.
     * Returns a simple JSON payload confirming the backend is up.
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "UP");
        response.put("application", appName);
        response.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(response);
    }
}
