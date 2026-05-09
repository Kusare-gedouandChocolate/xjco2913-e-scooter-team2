package com.scooter.modules.discount.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DiscountRuleStatusRequest {
    @NotNull(message = "Enabled flag is required")
    private Boolean enabled;
}
