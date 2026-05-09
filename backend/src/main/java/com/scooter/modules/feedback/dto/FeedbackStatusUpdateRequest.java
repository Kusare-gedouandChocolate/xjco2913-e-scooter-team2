package com.scooter.modules.feedback.dto;

import com.scooter.modules.feedback.entity.FeedbackStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FeedbackStatusUpdateRequest {
    @NotNull(message = "Feedback status is required")
    private FeedbackStatus status;
}
