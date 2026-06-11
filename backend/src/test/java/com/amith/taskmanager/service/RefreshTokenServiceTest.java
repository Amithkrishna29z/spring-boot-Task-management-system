package com.amith.taskmanager.service;

import com.amith.taskmanager.exception.InvalidRefreshTokenException;
import com.amith.taskmanager.model.RefreshToken;
import com.amith.taskmanager.model.User;
import com.amith.taskmanager.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    private static final long REFRESH_MS = 604_800_000L;

    @Mock
    private RefreshTokenRepository repository;

    private RefreshTokenService service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new RefreshTokenService(repository, REFRESH_MS);
        user = new User();
        user.setId(1L);
        user.setUsername("alice");
        lenient().when(repository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void createIssuesNonRevokedFutureDatedToken() {
        RefreshToken token = service.create(user);

        assertThat(token.getToken()).isNotBlank();
        assertThat(token.isRevoked()).isFalse();
        assertThat(token.getExpiryDate()).isAfter(Instant.now());
        assertThat(token.getUser()).isSameAs(user);
    }

    @Test
    void verifyAndRotateRevokesOldTokenAndIssuesNewOne() {
        RefreshToken existing = new RefreshToken();
        existing.setToken("old-token");
        existing.setUser(user);
        existing.setExpiryDate(Instant.now().plusSeconds(3600));
        when(repository.findByToken("old-token")).thenReturn(Optional.of(existing));

        RefreshToken rotated = service.verifyAndRotate("old-token");

        assertThat(existing.isRevoked()).isTrue();
        assertThat(rotated.getToken()).isNotEqualTo("old-token");
        assertThat(rotated.isRevoked()).isFalse();
        ArgumentCaptor<RefreshToken> saved = ArgumentCaptor.forClass(RefreshToken.class);
        verify(repository, atLeastOnce()).save(saved.capture());
    }

    @Test
    void verifyAndRotateRejectsExpiredToken() {
        RefreshToken expired = new RefreshToken();
        expired.setToken("expired");
        expired.setUser(user);
        expired.setExpiryDate(Instant.now().minusSeconds(1));
        when(repository.findByToken("expired")).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> service.verifyAndRotate("expired"))
                .isInstanceOf(InvalidRefreshTokenException.class);
    }

    @Test
    void verifyAndRotateRejectsRevokedToken() {
        RefreshToken revoked = new RefreshToken();
        revoked.setToken("revoked");
        revoked.setUser(user);
        revoked.setExpiryDate(Instant.now().plusSeconds(3600));
        revoked.setRevoked(true);
        when(repository.findByToken("revoked")).thenReturn(Optional.of(revoked));

        assertThatThrownBy(() -> service.verifyAndRotate("revoked"))
                .isInstanceOf(InvalidRefreshTokenException.class);
    }

    @Test
    void verifyAndRotateRejectsUnknownToken() {
        when(repository.findByToken("nope")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.verifyAndRotate("nope"))
                .isInstanceOf(InvalidRefreshTokenException.class);
    }
}
