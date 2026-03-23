package com.scooter.modules.scooter.controller;

import com.scooter.common.response.Result;
import com.scooter.modules.scooter.dto.PricingRuleResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/pricing-rules")
public class PricingRuleController {

    @GetMapping
    public Result<List<PricingRuleResponse>> getPricingRules() {
        List<PricingRuleResponse> rules = new ArrayList<>();

        PricingRuleResponse standardRule = new PricingRuleResponse();
        standardRule.setRuleId("rule-001");
        standardRule.setHireType("STANDARD");
        standardRule.setPrice(100);
        standardRule.setDiscountEnabled(false);

        rules.add(standardRule);

        return Result.success(rules);
    }
}