package com.scooter.modules.scooter.controller;

import com.scooter.common.response.Result;
import com.scooter.modules.scooter.entity.Scooter;
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
    public Result<List<Scooter>> getScooters(@RequestParam(required = false) ScooterStatus status) {
        if (status != null) {
            return Result.success(scooterService.findScootersByStatus(status));
        }
        return Result.success(scooterService.findAllScooters());
    }

    @GetMapping("/{scooterId}")
    public Result<Scooter> getById(@PathVariable Long scooterId) {
        return Result.success(scooterService.getById(scooterId));
    }
}