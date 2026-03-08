package com.scooter.modules.auth.service;

import com.scooter.modules.auth.dto.LoginRequest;
import com.scooter.modules.auth.dto.RegisterRequest;
import com.scooter.modules.auth.dto.UserResponse;

public interface AuthService {
    /**
     * Handles user registration, including password encryption and persistence.
     */
    UserResponse register(RegisterRequest request);

    /**
     * Validates credentials and returns a session token.
     */
    String login(LoginRequest request);
}