package com.soa.team17.auth.service;

import com.soa.team17.auth.dto.AuthRequest;
import com.soa.team17.auth.dto.AuthResponse;
import com.soa.team17.auth.dto.RegisterRequest;
import com.soa.team17.auth.model.Role;
import com.soa.team17.auth.model.User;
import com.soa.team17.auth.repository.UserRepository;
import com.soa.team17.auth.util.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        seedDefaultUsers();
    }

    private void seedDefaultUsers() {
        if (!userRepository.existsByEmail("officer@registry.org")) {
            User officer = new User(
                    "officer_jane",
                    "officer@registry.org",
                    passwordEncoder.encode("password"),
                    Role.registryOfficer,
                    "Global Clean Energy Registry"
            );
            userRepository.save(officer);
        }

        if (!userRepository.existsByEmail("solar@helios-power.com")) {
            User helios = new User(
                    "helios_admin",
                    "solar@helios-power.com",
                    passwordEncoder.encode("password"),
                    Role.certificateOwner,
                    "Helios Solar Energy Corp"
            );
            userRepository.save(helios);
        }
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials: user not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials: incorrect password");
        }

        String token = tokenProvider.generateToken(user);
        return new AuthResponse(
                token,
                28800,
                new AuthResponse.UserDto(user.getId(), user.getUsername(), user.getEmail(), user.getRole().name(), user.getOrganization())
        );
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new IllegalStateException("An account with this email already exists");
        }

        User user = new User(
                request.getUsername(),
                request.getEmail().toLowerCase(),
                passwordEncoder.encode(request.getPassword()),
                request.getRole(),
                request.getOrganization()
        );

        User saved = userRepository.save(user);
        String token = tokenProvider.generateToken(saved);

        return new AuthResponse(
                token,
                28800,
                new AuthResponse.UserDto(saved.getId(), saved.getUsername(), saved.getEmail(), saved.getRole().name(), saved.getOrganization())
        );
    }
}
