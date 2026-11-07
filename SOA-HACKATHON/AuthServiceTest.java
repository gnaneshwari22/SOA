package com.soa.team17.auth;

import com.soa.team17.auth.dto.AuthRequest;
import com.soa.team17.auth.dto.AuthResponse;
import com.soa.team17.auth.model.Role;
import com.soa.team17.auth.model.User;
import com.soa.team17.auth.repository.UserRepository;
import com.soa.team17.auth.service.AuthService;
import com.soa.team17.auth.util.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User("officer_jane", "officer@registry.org", "encoded_pass", Role.registryOfficer, "Global Registry");
        testUser.setId("usr-1");
    }

    @Test
    void testSuccessfulLogin() {
        when(userRepository.findByEmail("officer@registry.org")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password", "encoded_pass")).thenReturn(true);
        when(tokenProvider.generateToken(any(User.class))).thenReturn("mock-jwt-token");

        AuthResponse response = authService.login(new AuthRequest("officer@registry.org", "password"));

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mock-jwt-token");
        assertThat(response.getUser().getEmail()).isEqualTo("officer@registry.org");
    }

    @Test
    void testInvalidPasswordRejection() {
        when(userRepository.findByEmail("officer@registry.org")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongpass", "encoded_pass")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new AuthRequest("officer@registry.org", "wrongpass")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid credentials");
    }
}
