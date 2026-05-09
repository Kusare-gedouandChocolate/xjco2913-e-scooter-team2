package com.scooter.modules.feedback.dto;

import com.scooter.modules.feedback.entity.FeedbackCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FeedbackCreateRequest {
    @NotNull(message = "Feedback category is required")
    private FeedbackCategory category;

    @NotBlank(message = "Feedback content is required")
    @Size(max = 2000, message = "Feedback content must be 2000 characters or fewer")
    private String content;

    private Long bookingId;

    private Long scooterId;
}
