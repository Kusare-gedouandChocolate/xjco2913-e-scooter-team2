package com.scooter.modules.discount.dto;

import com.scooter.modules.discount.entity.DiscountRuleType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class DiscountRuleRequest {
    @NotNull(message = "Discount rule type is required")
    private DiscountRuleType ruleType;

    @NotNull(message = "Discount rate is required")
    @DecimalMin(value = "0.01", message = "Discount rate must be greater than 0")
    @DecimalMax(value = "100.00", message = "Discount rate must be less than or equal to 100")
    private BigDecimal discountRate;

    @NotNull(message = "Enabled flag is required")
    private Boolean enabled;

    @Min(value = 1, message = "Minimum completed bookings must be greater than 0")
    private Integer minCompletedBookings;
}
