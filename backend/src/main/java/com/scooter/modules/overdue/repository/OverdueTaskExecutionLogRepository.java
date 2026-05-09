package com.scooter.modules.overdue.repository;

import com.scooter.modules.overdue.entity.OverdueTaskExecutionLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OverdueTaskExecutionLogRepository extends JpaRepository<OverdueTaskExecutionLog, Long> {
}
