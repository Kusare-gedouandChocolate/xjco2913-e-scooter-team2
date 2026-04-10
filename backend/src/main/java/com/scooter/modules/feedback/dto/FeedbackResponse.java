package com.scooter.modules.feedback.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FeedbackResponse {
    private String feedbackId;
    private String userId;
    private String category;
    private String content;
    private String bookingId;
    private String scooterId;
    private LocalDateTime createdAt;
}
