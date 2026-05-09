package com.scooter.modules.scooter.controller;

import com.scooter.common.response.Result;
import com.scooter.modules.scooter.dto.PricingRuleResponse;
import com.scooter.modules.scooter.service.ScooterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pricing-rules")
public class PricingRuleController {

    @Autowired
    private ScooterService scooterService;

    @GetMapping
    public Result<List<PricingRuleResponse>> getPricingRules() {
        return Result.success(scooterService.getPricingRules());
    }

    @GetMapping("/{ruleId}")
    public Result<PricingRuleResponse> getPricingRuleById(@PathVariable Long ruleId) {
        return Result.success(scooterService.getPricingRuleById(ruleId));
    }
}
