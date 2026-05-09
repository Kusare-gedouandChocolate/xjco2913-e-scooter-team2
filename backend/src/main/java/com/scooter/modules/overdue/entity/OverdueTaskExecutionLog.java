package com.scooter.modules.overdue.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "overdue_task_execution_log")
@Data
public class OverdueTaskExecutionLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trigger_type", nullable = false)
    private String triggerType;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "scanned_count", nullable = false)
    private Integer scannedCount;

    @Column(name = "overdue_count", nullable = false)
    private Integer overdueCount;

    @Column(name = "success_count", nullable = false)
    private Integer successCount;

    @Column(name = "failure_count", nullable = false)
    private Integer failureCount;

    @Column(name = "skipped_count", nullable = false)
    private Integer skippedCount;

    @Column(nullable = false)
    private String status;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;
}
