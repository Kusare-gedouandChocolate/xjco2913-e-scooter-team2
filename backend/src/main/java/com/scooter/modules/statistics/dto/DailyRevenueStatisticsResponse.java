package com.scooter.modules.statistics.dto;

import lombok.Data;

import java.util.List;

@Data
public class DailyRevenueStatisticsResponse {
    private String queryMode;
    private Integer recentDays;
    private String startDate;
    private String endDate;
    private String totalRevenue;
    private Long totalPaymentCount;
    private boolean empty;
    private List<DailyRevenueSummaryResponse> dailyRevenue;
    private DailyRevenueSummaryResponse selectedDate;
    private DailyRevenueChartResponse chart;
}
