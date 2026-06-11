package com.amith.taskmanager.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI taskManagerOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Task Manager API")
                        .version("v1")
                        .description("REST API for the Task Manager application. Authentication uses httpOnly "
                                + "access/refresh cookies issued by /api/v1/auth/login; state-changing requests "
                                + "additionally require the X-XSRF-TOKEN header.")
                        .license(new License().name("MIT")));
    }
}
