package com.scooter.modules.damage.controller;

import com.scooter.common.response.Result;
import com.scooter.modules.damage.dto.DamageEventResponse;
import com.scooter.modules.damage.service.DamageEventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/damage-events")
public class DamageEventController {

    @Autowired
    private DamageEventService damageEventService;

    @GetMapping
    public Result<List<DamageEventResponse>> getDamageEvents() {
        return Result.success(damageEventService.getDamageEvents());
    }

    @GetMapping("/booking/{bookingId}")
    public Result<DamageEventResponse> getDamageEventByBookingId(@PathVariable Long bookingId) {
        return Result.success(damageEventService.getDamageEventByBookingId(bookingId));
    }
}
