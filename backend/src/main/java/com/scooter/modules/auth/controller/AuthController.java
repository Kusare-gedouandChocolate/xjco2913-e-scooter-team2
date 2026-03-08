package com.scooter.modules.auth.controller;

import com.scooter.common.response.Result;
import com.scooter.modules.auth.dto.LoginRequest;
import com.scooter.modules.auth.dto.RegisterRequest;
import com.scooter.modules.auth.dto.UserResponse;
import com.scooter.modules.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for user authentication.
 * Base URL: /api/v1/auth as per API naming specifications.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * Endpoint for user registration.
     * 
     * @param request Validated registration data.
     * @return Unified result with user details.
     */
    @PostMapping("/register")
    public Result<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        // Business logic is handled in the Service layer
        UserResponse response = authService.register(request);
        return Result.success(response);
    }

    /**
     * Endpoint for user login.
     * 
     * @param request Validated login credentials.
     * @return Unified result with session token.
     */
    @PostMapping("/login")
    public Result<String> login(@Valid @RequestBody LoginRequest request) {
        // In a real scenario, this would return a JWT or session ID
        String token = authService.login(request);
        return Result.success(token);
    }
}