package com.amith.taskmanager;

import com.amith.taskmanager.dto.LoginRequest;
import com.amith.taskmanager.dto.SignupRequest;
import com.amith.taskmanager.dto.TaskRequestDTO;
import com.amith.taskmanager.model.Task.TaskPriority;
import com.amith.taskmanager.model.Task.TaskStatus;
import com.amith.taskmanager.security.CookieUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Boots the whole app against a real Postgres container with Flyway on and Hibernate set to
// validate. If the context comes up, V1 matches the entities. Skipped when Docker isn't there.
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
class FlywayPostgresIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        // dev profile reads the JWT secret from env/.env; set it here so the test is
        // self-contained (there's no .env in CI)
        registry.add("app.jwt.secret", () -> "flyway-it-secret-flyway-it-secret-0123456789");
    }

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void migratedSchemaSupportsSignupAndLogin() throws Exception {
        String password = "Password123!";
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SignupRequest("pguser", password, "USER"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("pguser", password))))
                .andExpect(status().isOk())
                .andExpect(cookie().exists(CookieUtils.ACCESS_TOKEN_COOKIE))
                .andExpect(cookie().exists(CookieUtils.REFRESH_TOKEN_COOKIE));
    }

    // Regression test for the Postgres-only `function lower(bytea) does not exist` when
    // listing with a null keyword. H2 didn't reproduce it, so it's pinned against real Postgres.
    @Test
    void listAndSearchTasksWorkOnPostgres() throws Exception {
        String password = "Password123!";
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SignupRequest("listuser", password, "USER"))))
                .andExpect(status().isCreated());

        Cookie access = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("listuser", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getCookie(CookieUtils.ACCESS_TOKEN_COOKIE);

        TaskRequestDTO task = new TaskRequestDTO(
                "Buy groceries", "milk and eggs", TaskStatus.TODO, TaskPriority.MEDIUM, null);
        mockMvc.perform(post("/api/v1/tasks")
                        .cookie(access)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(task)))
                .andExpect(status().isCreated());

        // List with no filters (the path that failed on PostgreSQL).
        mockMvc.perform(get("/api/v1/tasks").cookie(access))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));

        // Keyword search exercises LOWER(CAST(:keyword AS string)).
        mockMvc.perform(get("/api/v1/tasks").param("keyword", "groceries").cookie(access))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }
}
