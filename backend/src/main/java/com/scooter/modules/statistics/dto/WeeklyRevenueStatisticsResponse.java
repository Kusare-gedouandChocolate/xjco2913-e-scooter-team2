package com.scooter.modules.statistics.dto;

import lombok.Data;

import java.util.List;

@Data
public class WeeklyRevenueStatisticsResponse {
    private String startDate;
    private String endDate;
    private String totalRevenue;
    private Long totalPaymentCount;
    private boolean empty;
    private List<WeeklyRevenueSummaryResponse> weeklyRevenue;
    private WeeklyRevenueSummaryResponse selectedWeek;
}
