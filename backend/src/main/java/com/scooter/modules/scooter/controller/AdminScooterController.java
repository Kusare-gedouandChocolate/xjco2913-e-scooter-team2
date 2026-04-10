package com.scooter.modules.scooter.controller;

import com.scooter.common.response.Result;
import com.scooter.modules.scooter.dto.AdminScooterRequest;
import com.scooter.modules.scooter.dto.AdminScooterResponse;
import com.scooter.modules.scooter.service.ScooterService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/scooters")
public class AdminScooterController {

    @Autowired
    private ScooterService scooterService;

    @PostMapping
    public Result<AdminScooterResponse> createScooter(@Valid @RequestBody AdminScooterRequest request) {
        return Result.success(scooterService.createScooter(request));
    }

    @GetMapping
    public Result<List<AdminScooterResponse>> getAllScooters() {
        return Result.success(scooterService.getAllScootersForAdmin());
    }

    @GetMapping("/{scooterId}")
    public Result<AdminScooterResponse> getScooterDetails(@PathVariable Long scooterId) {
        return Result.success(scooterService.getScooterDetailsForAdmin(scooterId));
    }

    @PutMapping("/{scooterId}")
    public Result<AdminScooterResponse> updateScooter(@PathVariable Long scooterId,
            @Valid @RequestBody AdminScooterRequest request) {
        return Result.success(scooterService.updateScooter(scooterId, request));
    }

    @DeleteMapping("/{scooterId}")
    public Result<Void> deleteScooter(@PathVariable Long scooterId) {
        scooterService.deleteScooter(scooterId);
        return Result.success(null);
    }
}
