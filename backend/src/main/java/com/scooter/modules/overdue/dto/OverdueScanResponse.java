package com.scooter.modules.overdue.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OverdueScanResponse {
    private String taskExecutionId;
    private String triggerType;
    private Integer scannedCount;
    private Integer overdueCount;
    private Integer successCount;
    private Integer failureCount;
    private Integer skippedCount;
    private String status;
}
