package com.scooter.modules.walkin.controller;

import com.scooter.common.response.Result;
import com.scooter.common.security.SecurityUtils;
import com.scooter.modules.walkin.dto.WalkInCustomerCreateRequest;
import com.scooter.modules.walkin.dto.WalkInCustomerResponse;
import com.scooter.modules.walkin.dto.WalkInPickupRequest;
import com.scooter.modules.walkin.dto.WalkInPickupResponse;
import com.scooter.modules.walkin.dto.WalkInReturnRequest;
import com.scooter.modules.walkin.dto.WalkInReturnResponse;
import com.scooter.modules.walkin.service.WalkInService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/walk-in")
public class WalkInController {

    @Autowired
    private WalkInService walkInService;

    @PostMapping("/customers")
    public Result<WalkInCustomerResponse> createWalkInCustomer(
            @Valid @RequestBody WalkInCustomerCreateRequest request) {
        SecurityUtils.requireStaffOrAdminRole();
        return Result.success(walkInService.createWalkInCustomer(request));
    }

    @PostMapping("/pickup")
    public Result<WalkInPickupResponse> pickupScooter(@Valid @RequestBody WalkInPickupRequest request) {
        SecurityUtils.requireStaffOrAdminRole();
        return Result.success(walkInService.pickupScooter(request));
    }

    @PostMapping("/return")
    public Result<WalkInReturnResponse> returnScooter(@Valid @RequestBody WalkInReturnRequest request) {
        SecurityUtils.requireStaffOrAdminRole();
        return Result.success(walkInService.returnScooter(request));
    }
}
