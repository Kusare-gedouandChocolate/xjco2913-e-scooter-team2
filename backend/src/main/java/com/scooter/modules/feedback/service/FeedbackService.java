package com.scooter.modules.feedback.service;

import com.scooter.common.exception.BusinessException;
import com.scooter.common.security.SecurityUtils;
import com.scooter.modules.booking.entity.Booking;
import com.scooter.modules.booking.repository.BookingRepository;
import com.scooter.modules.feedback.dto.FeedbackCreateRequest;
import com.scooter.modules.feedback.dto.FeedbackPriorityUpdateRequest;
import com.scooter.modules.feedback.dto.FeedbackResponse;
import com.scooter.modules.feedback.dto.FeedbackStatusUpdateRequest;
import com.scooter.modules.feedback.entity.Feedback;
import com.scooter.modules.feedback.entity.FeedbackPriority;
import com.scooter.modules.feedback.entity.FeedbackStatus;
import com.scooter.modules.feedback.repository.FeedbackRepository;
import com.scooter.modules.scooter.repository.ScooterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.data.web.SpringDataWebProperties;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ScooterRepository scooterRepository;

    @Transactional
    public FeedbackResponse createFeedback(FeedbackCreateRequest request) {
        UUID userId = UUID.fromString(SecurityUtils.getCurrentUserId());
        String content = normalizeContent(request.getContent());

        validateAssociations(userId, request.getBookingId(), request.getScooterId());

        Feedback feedback = new Feedback();
        feedback.setUserId(userId);
        feedback.setCategory(request.getCategory());
        feedback.setContent(content);
        feedback.setBookingId(request.getBookingId());
        feedback.setScooterId(request.getScooterId());

        return toResponse(feedbackRepository.save(feedback));
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> getMyFeedback() {
        UUID userId = UUID.fromString(SecurityUtils.getCurrentUserId());
        return feedbackRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FeedbackResponse getMyFeedbackDetail(Long feedbackId) {
        UUID userId = UUID.fromString(SecurityUtils.getCurrentUserId());
        Feedback feedback = feedbackRepository.findByIdAndUserId(feedbackId, userId)
                .orElseThrow(() -> new BusinessException("FEEDBACK_NOT_FOUND", "Feedback not found"));
        return toResponse(feedback);
    }

    @Transactional
    public FeedbackResponse updatePriority(Long feedbackId, FeedbackPriorityUpdateRequest request) {
        SecurityUtils.requireManagerRole();
        Feedback feedback = findFeedbackOrThrow(feedbackId);
        feedback.setPriority(request.getPriority());
        if (request.getPriority() == FeedbackPriority.HIGH && feedback.getStatus() == FeedbackStatus.SUBMITTED) {
            feedback.setStatus(FeedbackStatus.IN_PROGRESS);
        }
        return toResponse(feedbackRepository.save(feedback));
    }

    @Transactional
    public FeedbackResponse updateStatus(Long feedbackId, FeedbackStatusUpdateRequest request) {
        SecurityUtils.requireManagerRole();
        Feedback feedback = findFeedbackOrThrow(feedbackId);
        validateStatusTransition(feedback.getStatus(), request.getStatus());
        feedback.setStatus(request.getStatus());
        return toResponse(feedbackRepository.save(feedback));
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> getHighPriorityFeedback() {
        SecurityUtils.requireManagerRole();
        return feedbackRepository.findByPriorityOrderByCreatedAtDesc(FeedbackPriority.HIGH).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private void validateAssociations(UUID userId, Long bookingId, Long scooterId) {
        if (bookingId != null) {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Associated booking not found"));
            if (!userId.equals(booking.getUserId())) {
                throw new BusinessException("FEEDBACK_BOOKING_FORBIDDEN",
                        "You can only associate feedback with your own booking");
            }
        }

        if (scooterId != null && !scooterRepository.existsById(scooterId)) {
            throw new BusinessException("SCOOTER_NOT_FOUND", "Associated scooter not found");
        }
    }

    private String normalizeContent(String content) {
        String normalized = content == null ? "" : content.trim();
        if (normalized.isEmpty()) {
            throw new BusinessException("FEEDBACK_INVALID", "Feedback content must not be blank");
        }
        return normalized;
    }

    private Feedback findFeedbackOrThrow(Long feedbackId) {
        return feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new BusinessException("FEEDBACK_NOT_FOUND", "Feedback not found"));
    }

    private void validateStatusTransition(FeedbackStatus currentStatus, FeedbackStatus nextStatus) {
        if (currentStatus == nextStatus) {
            return;
        }
        boolean validTransition = switch (currentStatus) {
            case SUBMITTED -> nextStatus == FeedbackStatus.IN_PROGRESS;
            case IN_PROGRESS -> nextStatus == FeedbackStatus.RESOLVED;
            case RESOLVED -> false;
        };
        if (!validTransition) {
            throw new BusinessException("FEEDBACK_STATUS_CONFLICT",
                    "Invalid feedback status transition from " + currentStatus + " to " + nextStatus);
        }
    }

    private FeedbackResponse toResponse(Feedback feedback) {
        FeedbackResponse response = new FeedbackResponse();
        response.setFeedbackId(feedback.getId().toString());
        response.setUserId(feedback.getUserId().toString());
        response.setCategory(feedback.getCategory().name());
        response.setContent(feedback.getContent());
        response.setPriority(feedback.getPriority().name());
        response.setStatus(feedback.getStatus().name());
        response.setBookingId(feedback.getBookingId() != null ? feedback.getBookingId().toString() : null);
        response.setScooterId(feedback.getScooterId() != null ? feedback.getScooterId().toString() : null);
        response.setCreatedAt(feedback.getCreatedAt());
        return response;
    }

    @Transactional(readOnly = true)
    public Page<FeedbackResponse> getAllFeedback(FeedbackPriority priority, FeedbackStatus status, int page, int size) {
        SecurityUtils.requireManagerRole();

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Feedback> feedbackPage;

        if (priority != null && status != null) {
            feedbackPage = feedbackRepository.findByPriorityAndStatus(priority, status, pageable);
        } else if (priority != null) {
            feedbackPage = feedbackRepository.findByPriority(priority, pageable);
        } else if (status != null) {
            feedbackPage = feedbackRepository.findByStatus(status, pageable);
        } else {
            feedbackPage = feedbackRepository.findAll(pageable);
        }

        return feedbackPage.map(this::toResponse);
    }
}
