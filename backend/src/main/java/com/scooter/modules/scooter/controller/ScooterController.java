package com.scooter.modules.scooter.controller;

import com.scooter.common.response.Result;
import com.scooter.modules.scooter.dto.PricingRuleResponse;
import com.scooter.modules.scooter.dto.ScooterResponse;
import com.scooter.modules.scooter.entity.ScooterStatus;
import com.scooter.modules.scooter.service.ScooterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/scooters")
public class ScooterController {

    @Autowired
    private ScooterService scooterService;

    @GetMapping
    public Result<List<ScooterResponse>> getScooters(@RequestParam(required = false) ScooterStatus status) {
        if (status != null) {
            return Result.success(scooterService.findScootersByStatus(status));
        }
        return Result.success(scooterService.findAllScooters());
    }

    @GetMapping("/{scooterId}")
    public Result<ScooterResponse> getById(@PathVariable Long scooterId) {
        return Result.success(scooterService.getById(scooterId));
    }

    @GetMapping("/pricing-rules")
    public Result<List<PricingRuleResponse>> getPricingRules() {
        return Result.success(scooterService.getPricingRules());
    }
}