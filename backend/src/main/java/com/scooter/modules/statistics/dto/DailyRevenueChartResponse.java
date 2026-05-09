package com.scooter.modules.statistics.dto;

import lombok.Data;

import java.util.List;

@Data
public class DailyRevenueChartResponse {
    private List<String> labels;
    private List<String> revenueSeries;
    private List<Long> paymentCountSeries;
    private List<HireTypeChartSeriesResponse> hireTypeSeries;
}
