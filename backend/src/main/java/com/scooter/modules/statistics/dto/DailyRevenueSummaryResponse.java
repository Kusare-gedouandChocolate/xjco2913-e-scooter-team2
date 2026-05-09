package com.scooter.modules.statistics.dto;

import lombok.Data;

import java.util.List;

@Data
public class DailyRevenueSummaryResponse {
    private String date;
    private String totalRevenue;
    private Long paymentCount;
    private List<RevenueByHireTypeResponse> revenueByHireType;
}
