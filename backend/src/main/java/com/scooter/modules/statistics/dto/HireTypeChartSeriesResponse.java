package com.scooter.modules.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class HireTypeChartSeriesResponse {
    private String hireType;
    private List<String> revenueSeries;
}
