package com.scooter.modules.statistics.dto;

import lombok.Data;

import java.util.List;

@Data
public class WeeklyRevenueSummaryResponse {
    private String weekStart;
    private String weekEnd;
    private String totalRevenue;
    private Long paymentCount;
    private List<RevenueByHireTypeResponse> revenueByHireType;
}
