package com.scooter.modules.scooter.controller;

import com.scooter.modules.common.Result;
import com.scooter.modules.scooter.dto.ScooterResponse;
import com.scooter.modules.scooter.entity.RentalOption;
import com.scooter.modules.scooter.service.ScooterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/scooters")
public class ScooterController {

    @Autowired
    private ScooterService scooterService;

    /**
     * Endpoint for fetching available scooters list with pagination.
     * Usage: GET /api/v1/scooters/available?page=0&size=10
     */
    @GetMapping("/available")
    public Result<Page<ScooterResponse>> listAvailable(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return Result.success(scooterService.getAvailableScooters(page, size));
    }

    /**
     * Endpoint for fetching all pricing plans.
     * Usage: GET /api/v1/scooters/pricing
     */
    @GetMapping("/pricing")
    public Result<List<RentalOption>> listPricing() {
        return Result.success(scooterService.getPricingOptions());
    }

    @PostMapping("/pay")
    public Result<BookingConfirmation> pay(@RequestBody PaymentRequest request) {
        return Result.success(bookingService.processPayment(request));
    }
}