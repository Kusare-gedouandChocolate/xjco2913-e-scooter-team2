package com.scooter.modules.overdue.controller;

import com.scooter.common.response.Result;
import com.scooter.common.security.SecurityUtils;
import com.scooter.modules.overdue.dto.OverdueScanResponse;
import com.scooter.modules.overdue.service.OverdueOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/overdue-jobs")
public class OverdueOrderController {

    @Autowired
    private OverdueOrderService overdueOrderService;

    @PostMapping("/scan")
    public Result<OverdueScanResponse> triggerScan() {
        SecurityUtils.requireManagerRole();
        return Result.success(overdueOrderService.scanOverdueOrders("MANUAL"));
    }
}
