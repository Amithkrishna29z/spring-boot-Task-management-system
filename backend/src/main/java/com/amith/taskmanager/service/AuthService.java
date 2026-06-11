package com.amith.taskmanager.service;

import com.amith.taskmanager.exception.UserAlreadyExistsException;
import com.amith.taskmanager.exception.UserNotFoundException;
import com.amith.taskmanager.model.Role;
import com.amith.taskmanager.model.RefreshToken;
import com.amith.taskmanager.security.UserPrincipal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.amith.taskmanager.dto.LoginRequest;
import com.amith.taskmanager.dto.SignupRequest;
import com.amith.taskmanager.model.User;
import com.amith.taskmanager.repository.UserRepository;
import com.amith.taskmanager.security.JwtUtils;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private RefreshTokenService refreshTokenService;

    public AuthResult login(LoginRequest request) {
        logger.info("Login attempt for user: {}", request.getUsername());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        String accessToken = jwtUtils.generateTokenForUsername(principal.getUsername());
        RefreshToken refreshToken = refreshTokenService.create(user);

        logger.info("User {} logged in successfully", request.getUsername());
        return new AuthResult(accessToken, refreshToken.getToken(), principal.getUsername(), resolveRole(principal));
    }

    @Transactional
    public AuthResult refresh(String refreshTokenValue) {
        RefreshToken rotated = refreshTokenService.verifyAndRotate(refreshTokenValue);
        User user = rotated.getUser();

        String accessToken = jwtUtils.generateTokenForUsername(user.getUsername());
        UserPrincipal principal = UserPrincipal.create(user);

        logger.debug("Issued new access token for user {} via refresh", user.getUsername());
        return new AuthResult(accessToken, rotated.getToken(), user.getUsername(), resolveRole(principal));
    }

    public void logout(String refreshTokenValue) {
        if (refreshTokenValue != null) {
            refreshTokenService.revoke(refreshTokenValue);
        }
    }

    @Transactional
    public String register(SignupRequest request) {
        logger.info("Registration attempt for user: {}", request.getUsername());

        if (userRepository.existsByUsername(request.getUsername())) {
            logger.warn("Registration failed: username {} already exists", request.getUsername());
            throw new UserAlreadyExistsException(request.getUsername());
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(encoder.encode(request.getPassword()));

        Role role = request.getRole() != null ? Role.fromString(request.getRole()) : Role.ROLE_USER;
        user.setRole(role.getAuthority());

        userRepository.save(user);
        logger.info("User {} registered successfully with role: {}", request.getUsername(), role);
        return "User registered successfully!";
    }

    private String resolveRole(UserPrincipal principal) {
        return principal.getAuthorities().stream()
                .findFirst()
                .map(GrantedAuthority::getAuthority)
                .orElse(Role.ROLE_USER.getAuthority());
    }
}
