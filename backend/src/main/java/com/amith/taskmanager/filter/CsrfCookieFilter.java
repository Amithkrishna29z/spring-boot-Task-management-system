package com.amith.taskmanager.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// Touches the CsrfToken so the XSRF-TOKEN cookie actually gets written on every response.
// The SPA reads that cookie and sends it back in the X-XSRF-TOKEN header on writes.
public class CsrfCookieFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (csrfToken != null) {
            // reading the token makes CookieCsrfTokenRepository write the cookie
            csrfToken.getToken();
        }
        filterChain.doFilter(request, response);
    }
}
