package com.scooter.modules.statistics.controller;

import com.scooter.common.response.Result;
import com.scooter.modules.statistics.dto.DailyRevenueStatisticsResponse;
import com.scooter.modules.statistics.dto.WeeklyRevenueStatisticsResponse;
import com.scooter.modules.statistics.service.RevenueStatisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/admin/statistics")
public class RevenueStatisticsController {

    @Autowired
    private RevenueStatisticsService revenueStatisticsService;

    @GetMapping("/weekly-revenue")
    public Result<WeeklyRevenueStatisticsResponse> getWeeklyRevenue(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        return Result.success(revenueStatisticsService.getWeeklyRevenueStatistics(startDate, endDate, weekStart));
    }

    @GetMapping("/daily-revenue")
    public Result<DailyRevenueStatisticsResponse> getDailyRevenue(
            @RequestParam(required = false) Integer recentDays,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return Result.success(revenueStatisticsService.getDailyRevenueStatistics(recentDays, startDate, endDate, date));
    }
}
