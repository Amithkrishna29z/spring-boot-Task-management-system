package com.amith.taskmanager.controller;

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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String VALID_PASSWORD = "Password123!";

    private void signup(String username) throws Exception {
        SignupRequest request = new SignupRequest(username, VALID_PASSWORD, "USER");
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    private MvcResult login(String username) throws Exception {
        LoginRequest request = new LoginRequest(username, VALID_PASSWORD);
        return mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();
    }

    @Test
    void signupThenLoginIssuesHttpOnlyCookies() throws Exception {
        signup("alice");
        MvcResult result = login("alice");

        Cookie access = result.getResponse().getCookie(CookieUtils.ACCESS_TOKEN_COOKIE);
        Cookie refresh = result.getResponse().getCookie(CookieUtils.REFRESH_TOKEN_COOKIE);

        assertThat(access).isNotNull();
        assertThat(access.isHttpOnly()).isTrue();
        assertThat(access.getValue()).isNotBlank();
        assertThat(refresh).isNotNull();
        assertThat(refresh.isHttpOnly()).isTrue();
        assertThat(result.getResponse().getContentAsString()).contains("\"username\":\"alice\"");
    }

    @Test
    void loginWithUnknownUserReturnsGenericUnauthorized() throws Exception {
        LoginRequest request = new LoginRequest("ghost", VALID_PASSWORD);
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                // Same message as a wrong password -> no username enumeration.
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    @Test
    void loginWithBlankCredentialsReturnsValidationError() throws Exception {
        LoginRequest request = new LoginRequest("", "");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void tasksEndpointRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/tasks"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void fullTaskLifecycleWithCookieAndCsrf() throws Exception {
        signup("taskuser");
        Cookie access = login("taskuser").getResponse().getCookie(CookieUtils.ACCESS_TOKEN_COOKIE);

        TaskRequestDTO task = new TaskRequestDTO(
                "Write integration tests", "cover the happy path",
                TaskStatus.TODO, TaskPriority.HIGH, null);

        mockMvc.perform(post("/api/v1/tasks")
                        .cookie(access)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(task)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Write integration tests"));

        mockMvc.perform(get("/api/v1/tasks").cookie(access))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }
}
