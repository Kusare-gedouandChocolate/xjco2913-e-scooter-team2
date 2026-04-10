package com.scooter.modules.feedback.service;

import com.scooter.common.exception.BusinessException;
import com.scooter.common.security.SecurityUtils;
import com.scooter.modules.booking.entity.Booking;
import com.scooter.modules.booking.repository.BookingRepository;
import com.scooter.modules.feedback.dto.FeedbackCreateRequest;
import com.scooter.modules.feedback.dto.FeedbackResponse;
import com.scooter.modules.feedback.entity.Feedback;
import com.scooter.modules.feedback.repository.FeedbackRepository;
import com.scooter.modules.scooter.repository.ScooterRepository;
import org.springframework.beans.factory.annotation.Autowired;
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

    private FeedbackResponse toResponse(Feedback feedback) {
        FeedbackResponse response = new FeedbackResponse();
        response.setFeedbackId(feedback.getId().toString());
        response.setUserId(feedback.getUserId().toString());
        response.setCategory(feedback.getCategory().name());
        response.setContent(feedback.getContent());
        response.setBookingId(feedback.getBookingId() != null ? feedback.getBookingId().toString() : null);
        response.setScooterId(feedback.getScooterId() != null ? feedback.getScooterId().toString() : null);
        response.setCreatedAt(feedback.getCreatedAt());
        return response;
    }
}
