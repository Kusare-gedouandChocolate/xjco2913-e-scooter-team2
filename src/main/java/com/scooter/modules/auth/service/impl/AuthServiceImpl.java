package com.scooter.modules.auth.service.impl;

import com.scooter.modules.auth.dto.LoginRequest;
import com.scooter.modules.auth.dto.RegisterRequest;
import com.scooter.modules.auth.dto.UserResponse;
import com.scooter.modules.auth.entity.User;
import com.scooter.modules.auth.repository.UserRepository;
import com.scooter.modules.auth.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public UserResponse register(RegisterRequest request) {
        // 1. Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        // 2. Encrypt password using BCrypt
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // 3. Create and save user
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(encodedPassword)
                .role(request.getRole() != null ? request.getRole() : "customer")
                .build();

        User savedUser = userRepository.save(user);

        // 4. Return formatted response
        return UserResponse.builder()
                .userId(savedUser.getUserId())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .build();
    }

    @Override
    public String login(LoginRequest request) {
        // Find user, check password, and generate a simple token (placeholder for now)
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        return "mock-jwt-token-for-" + user.getUserId();
    }
}