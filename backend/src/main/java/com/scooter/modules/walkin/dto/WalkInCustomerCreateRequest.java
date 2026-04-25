package com.scooter.modules.walkin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class WalkInCustomerCreateRequest {

    @NotBlank(message = "Customer full name is required")
    private String fullName;

    @NotBlank(message = "Customer phone is required")
    @Pattern(
            regexp = "^[0-9+()\\-\\s]{6,30}$",
            message = "Customer phone format is invalid")
    private String phone;

    @NotBlank(message = "Card token is required")
    private String cardToken;
}
