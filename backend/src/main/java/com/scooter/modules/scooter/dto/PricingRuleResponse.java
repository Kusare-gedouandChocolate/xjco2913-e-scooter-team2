package com.scooter.modules.scooter.dto;

import lombok.Data;

@Data
public class PricingRuleResponse {
    private String ruleId;
    private String hireType;
    private Integer price;
    private Boolean discountEnabled;
}
