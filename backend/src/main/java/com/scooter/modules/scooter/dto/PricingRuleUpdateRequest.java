package com.scooter.modules.scooter.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PricingRuleUpdateRequest {
    @NotBlank(message = "Hire type is required")
    @Size(max = 50, message = "Hire type must be 50 characters or fewer")
    private String hireType;

    @NotNull(message = "Duration hours is required")
    @Min(value = 1, message = "Duration hours must be greater than 0")
    private Integer durationHours;

    @NotNull(message = "Price is required")
    @Min(value = 0, message = "Price must be greater than or equal to 0")
    private BigDecimal price;
}
