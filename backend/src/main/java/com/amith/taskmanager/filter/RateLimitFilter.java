package com.amith.taskmanager.filter;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

// Rate-limits the login/signup endpoints per client IP to slow down brute-force and
// credential stuffing. Buckets live in an in-memory Caffeine cache — a multi-instance
// deploy would need a shared store (Redis via bucket4j-redis).
public class RateLimitFilter extends OncePerRequestFilter {

    private final int capacity;
    private final int durationMinutes;
    private final Cache<String, Bucket> buckets;

    public RateLimitFilter(int capacity, int durationMinutes) {
        this.capacity = capacity;
        this.durationMinutes = durationMinutes;
        this.buckets = Caffeine.newBuilder()
                .maximumSize(100_000)
                .expireAfterAccess(Duration.ofMinutes(durationMinutes * 2L))
                .build();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = request.getServletPath();
        return !("/api/v1/auth/login".equals(path) || "/api/v1/auth/signup".equals(path));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        Bucket bucket = buckets.get(clientKey(request), key -> newBucket());
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (probe.isConsumed()) {
            response.addHeader("X-Rate-Limit-Remaining", Long.toString(probe.getRemainingTokens()));
            filterChain.doFilter(request, response);
            return;
        }

        long retryAfterSeconds = probe.getNanosToWaitForRefill() / 1_000_000_000L;
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.addHeader("X-Rate-Limit-Retry-After-Seconds", Long.toString(retryAfterSeconds));
        response.getWriter().write(
                "{\"status\":429,\"message\":\"Too many requests. Please try again later.\"}");
    }

    private Bucket newBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(capacity)
                .refillIntervally(capacity, Duration.ofMinutes(durationMinutes))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwarded)) {
            // first hop is the real client
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
