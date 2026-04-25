package com.scooter.modules.overdue.service;

import com.scooter.modules.auth.entity.User;
import com.scooter.modules.auth.repository.UserRepository;
import com.scooter.modules.booking.entity.Booking;
import com.scooter.modules.booking.entity.BookingStatus;
import com.scooter.modules.booking.repository.BookingRepository;
import com.scooter.modules.booking.service.BookingBillingService;
import com.scooter.modules.overdue.dto.OverdueScanResponse;
import com.scooter.modules.overdue.entity.OverdueChargeExecutionLog;
import com.scooter.modules.overdue.entity.OverdueTaskExecutionLog;
import com.scooter.modules.overdue.entity.ReminderRecord;
import com.scooter.modules.overdue.repository.OverdueChargeExecutionLogRepository;
import com.scooter.modules.overdue.repository.OverdueTaskExecutionLogRepository;
import com.scooter.modules.overdue.repository.ReminderRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class OverdueOrderService {

    private static final String REMINDER_TYPE_OVERDUE_RETURN = "OVERDUE_RETURN";
    private static final String STATUS_SUCCESS = "SUCCESS";
    private static final String STATUS_FAILED = "FAILED";
    private static final String STATUS_SKIPPED = "SKIPPED";
    private static final String STATUS_COMPLETED = "COMPLETED";
    private static final String STATUS_ERROR = "ERROR";

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReminderRecordRepository reminderRecordRepository;

    @Autowired
    private OverdueChargeExecutionLogRepository chargeExecutionLogRepository;

    @Autowired
    private OverdueTaskExecutionLogRepository taskExecutionLogRepository;

    @Autowired
    private BookingBillingService bookingBillingService;

    @Scheduled(fixedDelayString = "${scooter.overdue.scan-fixed-delay-ms:300000}")
    public void scheduledScan() {
        scanOverdueOrders("SCHEDULED");
    }

    @Transactional
    public OverdueScanResponse scanOverdueOrders(String triggerType) {
        LocalDateTime startedAt = LocalDateTime.now();
        OverdueTaskExecutionLog taskLog = new OverdueTaskExecutionLog();
        taskLog.setTriggerType(triggerType);
        taskLog.setStartedAt(startedAt);
        taskLog.setScannedCount(0);
        taskLog.setOverdueCount(0);
        taskLog.setSuccessCount(0);
        taskLog.setFailureCount(0);
        taskLog.setSkippedCount(0);
        taskLog.setStatus("RUNNING");
        taskExecutionLogRepository.save(taskLog);

        try {
            List<Booking> activeBookings = bookingRepository.findByStatus(BookingStatus.IN_PROGRESS);
            int overdueCount = 0;
            int successCount = 0;
            int failureCount = 0;
            int skippedCount = 0;
            LocalDateTime now = LocalDateTime.now();

            for (Booking booking : activeBookings) {
                if (!isOverdue(booking, now)) {
                    continue;
                }

                overdueCount++;
                ensureReminderRecord(booking, now);

                ProcessingResult result = processAutoCharge(booking, triggerType, now);
                switch (result) {
                    case SUCCESS -> successCount++;
                    case FAILED -> failureCount++;
                    case SKIPPED -> skippedCount++;
                }
            }

            taskLog.setFinishedAt(LocalDateTime.now());
            taskLog.setScannedCount(activeBookings.size());
            taskLog.setOverdueCount(overdueCount);
            taskLog.setSuccessCount(successCount);
            taskLog.setFailureCount(failureCount);
            taskLog.setSkippedCount(skippedCount);
            taskLog.setStatus(STATUS_COMPLETED);
            taskExecutionLogRepository.save(taskLog);

            return OverdueScanResponse.builder()
                    .taskExecutionId(taskLog.getId().toString())
                    .triggerType(triggerType)
                    .scannedCount(activeBookings.size())
                    .overdueCount(overdueCount)
                    .successCount(successCount)
                    .failureCount(failureCount)
                    .skippedCount(skippedCount)
                    .status(taskLog.getStatus())
                    .build();
        } catch (Exception ex) {
            taskLog.setFinishedAt(LocalDateTime.now());
            taskLog.setStatus(STATUS_ERROR);
            taskLog.setErrorMessage(ex.getMessage());
            taskExecutionLogRepository.save(taskLog);

            return OverdueScanResponse.builder()
                    .taskExecutionId(taskLog.getId().toString())
                    .triggerType(triggerType)
                    .scannedCount(taskLog.getScannedCount())
                    .overdueCount(taskLog.getOverdueCount())
                    .successCount(taskLog.getSuccessCount())
                    .failureCount(taskLog.getFailureCount())
                    .skippedCount(taskLog.getSkippedCount())
                    .status(taskLog.getStatus())
                    .build();
        }
    }

    private boolean isOverdue(Booking booking, LocalDateTime now) {
        LocalDateTime dueAt = resolveDueAt(booking);
        return dueAt != null && dueAt.isBefore(now);
    }

    private LocalDateTime resolveDueAt(Booking booking) {
        LocalDateTime actualStartTime = booking.getPickedUpAt() != null
                ? booking.getPickedUpAt()
                : booking.getStartTime() != null ? booking.getStartTime() : booking.getCreatedAt();
        Integer durationHours = booking.getRentalOption() != null ? booking.getRentalOption().getDurationHours() : null;
        if (actualStartTime == null || durationHours == null || durationHours <= 0) {
            return null;
        }
        return actualStartTime.plusHours(durationHours);
    }

    private void ensureReminderRecord(Booking booking, LocalDateTime now) {
        LocalDateTime reminderWindowStart = now.minusMinutes(30);
        boolean reminderExists = reminderRecordRepository.existsByBookingIdAndReminderTypeAndCreatedAtAfter(
                booking.getId(),
                REMINDER_TYPE_OVERDUE_RETURN,
                reminderWindowStart);
        if (reminderExists) {
            return;
        }

        LocalDateTime dueAt = resolveDueAt(booking);
        ReminderRecord reminder = new ReminderRecord();
        reminder.setBookingId(booking.getId());
        reminder.setReminderType(REMINDER_TYPE_OVERDUE_RETURN);
        reminder.setMessage("Booking " + booking.getId() + " is overdue for return since "
                + (dueAt != null ? dueAt : "unknown due time"));
        reminderRecordRepository.save(reminder);

        booking.setLastOverdueReminderAt(now);
        bookingRepository.save(booking);
    }

    private ProcessingResult processAutoCharge(Booking booking, String triggerType, LocalDateTime now) {
        Optional<OverdueChargeExecutionLog> latestLog = chargeExecutionLogRepository
                .findTopByBookingIdOrderByCreatedAtDesc(booking.getId());
        if (latestLog.isPresent()
                && STATUS_FAILED.equals(latestLog.get().getStatus())
                && latestLog.get().getNextRetryAt() != null
                && latestLog.get().getNextRetryAt().isAfter(now)) {
            writeExecutionLog(booking, triggerType, BigDecimal.ZERO, STATUS_SKIPPED,
                    "Retry scheduled at " + latestLog.get().getNextRetryAt(), null);
            return ProcessingResult.SKIPPED;
        }

        BigDecimal projectedOvertimeFee = bookingBillingService.calculateOvertimeFeeAt(booking, now);
        BigDecimal alreadyChargedAmount = booking.getAutoChargedAmount() != null
                ? booking.getAutoChargedAmount()
                : BigDecimal.ZERO.setScale(2);
        BigDecimal chargeableAmount = projectedOvertimeFee.subtract(alreadyChargedAmount);
        if (chargeableAmount.signum() <= 0) {
            writeExecutionLog(booking, triggerType, BigDecimal.ZERO, STATUS_SKIPPED,
                    "No new overdue fee to charge", null);
            return ProcessingResult.SKIPPED;
        }

        User user = userRepository.findById(booking.getUserId())
                .orElse(null);
        if (user == null || user.getCardToken() == null || user.getCardToken().isBlank()) {
            LocalDateTime nextRetryAt = scheduleNextRetry(booking, now);
            writeExecutionLog(booking, triggerType, chargeableAmount, STATUS_FAILED,
                    "Card token is missing for automatic overdue charge", nextRetryAt);
            return ProcessingResult.FAILED;
        }

        if (user.getCardToken().toLowerCase().contains("fail")) {
            LocalDateTime nextRetryAt = scheduleNextRetry(booking, now);
            writeExecutionLog(booking, triggerType, chargeableAmount, STATUS_FAILED,
                    "Mock card provider rejected the automatic overdue charge", nextRetryAt);
            return ProcessingResult.FAILED;
        }

        booking.setAutoChargedAmount(alreadyChargedAmount.add(chargeableAmount));
        bookingRepository.save(booking);
        writeExecutionLog(booking, triggerType, chargeableAmount, STATUS_SUCCESS, null, null);
        return ProcessingResult.SUCCESS;
    }

    private void writeExecutionLog(Booking booking, String triggerType, BigDecimal amount, String status,
            String failureReason, LocalDateTime nextRetryAt) {
        OverdueChargeExecutionLog executionLog = new OverdueChargeExecutionLog();
        executionLog.setBookingId(booking.getId());
        executionLog.setTriggerType(triggerType);
        executionLog.setAttemptNo((int) chargeExecutionLogRepository.countByBookingId(booking.getId()) + 1);
        executionLog.setChargeAmount(amount.setScale(2, BigDecimal.ROUND_HALF_UP));
        executionLog.setPaymentMethod("CREDIT_CARD");
        executionLog.setStatus(status);
        executionLog.setFailureReason(failureReason);
        executionLog.setNextRetryAt(nextRetryAt);
        chargeExecutionLogRepository.save(executionLog);
    }

    private LocalDateTime scheduleNextRetry(Booking booking, LocalDateTime now) {
        int attemptNo = (int) chargeExecutionLogRepository.countByBookingId(booking.getId()) + 1;
        int retryDelayMinutes = Math.min(attemptNo, 4) * 15;
        return now.plusMinutes(retryDelayMinutes);
    }

    private enum ProcessingResult {
        SUCCESS,
        FAILED,
        SKIPPED
    }
}
