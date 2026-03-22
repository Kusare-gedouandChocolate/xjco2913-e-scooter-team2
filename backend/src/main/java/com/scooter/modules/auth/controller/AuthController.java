package com.scooter.modules.auth.controller;

import com.scooter.common.response.Result;
import com.scooter.modules.auth.dto.LoginRequest;
import com.scooter.modules.auth.dto.LoginResponse;
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
    public Result<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse user = authService.register(request);
        String token = authService.generateToken(user.getUserId());
        return Result.success(new LoginResponse(token, user));
    }

    /**
     * Endpoint for user login.
     * 
     * @param request Validated login credentials.
     * @return Unified result with session token.
     */
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        String token = authService.login(request);
        UserResponse user = authService.getUserByEmail(request.getEmail());
        return Result.success(new LoginResponse(token, user));
    }
}
