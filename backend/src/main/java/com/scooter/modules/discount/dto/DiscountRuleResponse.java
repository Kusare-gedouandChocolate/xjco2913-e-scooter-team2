package com.scooter.modules.discount.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class DiscountRuleResponse {
    private String ruleId;
    private String ruleType;
    private BigDecimal discountRate;
    private Boolean enabled;
    private Integer minCompletedBookings;
    private String eligibilityDescription;
    private LocalDateTime createdAt;
}
