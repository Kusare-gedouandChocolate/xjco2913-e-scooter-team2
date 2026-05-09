package com.scooter.modules.feedback.dto;

import com.scooter.modules.feedback.entity.FeedbackPriority;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FeedbackPriorityUpdateRequest {
    @NotNull(message = "Feedback priority is required")
    private FeedbackPriority priority;
}
