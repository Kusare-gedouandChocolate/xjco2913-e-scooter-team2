package com.scooter.modules.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RevenueByHireTypeResponse {
    private String hireType;
    private String revenue;
    private Long paymentCount;
}
