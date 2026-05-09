package com.scooter.modules.scooter.controller;

import com.scooter.common.response.Result;
import com.scooter.modules.scooter.dto.PricingRuleResponse;
import com.scooter.modules.scooter.dto.PricingRuleUpdateRequest;
import com.scooter.modules.scooter.service.ScooterService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/pricing-rules")
public class AdminPricingRuleController {

    @Autowired
    private ScooterService scooterService;

    @PutMapping("/{ruleId}")
    public Result<PricingRuleResponse> updatePricingRule(@PathVariable Long ruleId,
            @Valid @RequestBody PricingRuleUpdateRequest request) {
        return Result.success(scooterService.updatePricingRule(ruleId, request));
    }
}
