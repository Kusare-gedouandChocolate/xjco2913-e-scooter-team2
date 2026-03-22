package com.scooter.modules.auth.service.impl;

import com.scooter.common.security.JwtUtils;
import com.scooter.modules.auth.dto.LoginRequest;
import com.scooter.modules.auth.dto.RegisterRequest;
import com.scooter.modules.auth.dto.UserResponse;
import com.scooter.modules.auth.entity.User;
import com.scooter.modules.auth.repository.UserRepository;
import com.scooter.modules.auth.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(encodedPassword)
                .role(request.getRole() != null ? request.getRole() : "customer")
                .build();

        User savedUser = userRepository.save(user);

        return UserResponse.builder()
                .userId(savedUser.getUserId())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .build();
    }

    @Override
    public String login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        return jwtUtils.generateToken(user.getUserId(), user.getEmail(), user.getRole());
    }

    @Override
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return UserResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Override
    public String generateToken(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return jwtUtils.generateToken(user.getUserId(), user.getEmail(), user.getRole());
    }
}