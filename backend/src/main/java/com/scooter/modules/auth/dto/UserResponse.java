package com.scooter.modules.auth.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID userId;
    private String email;
    private String role;
    private String fullName;
    private String phone;
}