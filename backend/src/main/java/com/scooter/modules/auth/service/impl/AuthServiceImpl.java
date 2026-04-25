package com.scooter.modules.auth.service.impl;

import com.scooter.common.exception.BusinessException;
import com.scooter.common.security.JwtUtils;
import com.scooter.common.security.RoleUtils;
import com.scooter.modules.auth.dto.LoginRequest;
import com.scooter.modules.auth.dto.RegisterRequest;
import com.scooter.modules.auth.dto.UserResponse;
import com.scooter.modules.auth.entity.User;
import com.scooter.modules.auth.repository.UserRepository;
import com.scooter.modules.auth.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    public UserResponse register(RegisterRequest request) {
        String email = Objects.requireNonNull(request.getEmail(), "Email must not be null");
        if (userRepository.findByEmail(email).isPresent()) {
            throw new BusinessException("USER_CONFLICT", "Email already registered");
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = User.builder()
                .email(email)
                .passwordHash(encodedPassword)
                .role(RoleUtils.normalizeRole(request.getRole()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .build();

        User savedUser = Objects.requireNonNull(userRepository.save(user), "Saved user must not be null");

        return UserResponse.builder()
                .userId(savedUser.getUserId())
                .email(savedUser.getEmail())
                .role(RoleUtils.normalizeRole(savedUser.getRole()))
                .build();
    }

    @Override
    public String login(LoginRequest request) {
        String email = Objects.requireNonNull(request.getEmail(), "Email must not be null");
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("AUTH_INVALID_CREDENTIALS", "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessException("AUTH_INVALID_CREDENTIALS", "Invalid credentials");
        }

        return jwtUtils.generateToken(user.getUserId(), user.getEmail(), RoleUtils.normalizeRole(user.getRole()));
    }

    @Override
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(Objects.requireNonNull(email, "Email must not be null"))
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "User not found"));
        return UserResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .role(RoleUtils.normalizeRole(user.getRole()))
                .build();
    }

    @Override
    public String generateToken(UUID userId) {
        User user = userRepository.findById(Objects.requireNonNull(userId, "User ID must not be null"))
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "User not found"));
        return jwtUtils.generateToken(user.getUserId(), user.getEmail(), RoleUtils.normalizeRole(user.getRole()));
    }
}
