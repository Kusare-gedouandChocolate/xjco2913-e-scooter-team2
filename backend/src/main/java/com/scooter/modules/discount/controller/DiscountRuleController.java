package com.scooter.modules.discount.controller;

import com.scooter.common.response.Result;
import com.scooter.modules.discount.dto.DiscountRuleResponse;
import com.scooter.modules.discount.service.DiscountRuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/discount-rules")
public class DiscountRuleController {

    @Autowired
    private DiscountRuleService discountRuleService;

    @GetMapping
    public Result<List<DiscountRuleResponse>> getDiscountRules() {
        return Result.success(discountRuleService.getDiscountRules());
    }
}
