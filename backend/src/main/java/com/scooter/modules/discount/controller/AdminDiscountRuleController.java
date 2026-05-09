package com.scooter.modules.discount.controller;

import com.scooter.common.response.Result;
import com.scooter.modules.discount.dto.DiscountRuleRequest;
import com.scooter.modules.discount.dto.DiscountRuleResponse;
import com.scooter.modules.discount.dto.DiscountRuleStatusRequest;
import com.scooter.modules.discount.service.DiscountRuleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/discount-rules")
public class AdminDiscountRuleController {

    @Autowired
    private DiscountRuleService discountRuleService;

    @PostMapping
    public Result<DiscountRuleResponse> createRule(@Valid @RequestBody DiscountRuleRequest request) {
        return Result.success(discountRuleService.createDiscountRule(request));
    }

    @PatchMapping("/{ruleId}/status")
    public Result<DiscountRuleResponse> updateStatus(@PathVariable Long ruleId,
            @Valid @RequestBody DiscountRuleStatusRequest request) {
        return Result.success(discountRuleService.updateRuleStatus(ruleId, request));
    }
}
