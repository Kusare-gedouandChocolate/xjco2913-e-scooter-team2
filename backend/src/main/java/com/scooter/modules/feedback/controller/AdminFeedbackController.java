package com.scooter.modules.feedback.controller;

import com.scooter.common.response.Result;
import com.scooter.modules.feedback.dto.FeedbackPriorityUpdateRequest;
import com.scooter.modules.feedback.dto.FeedbackResponse;
import com.scooter.modules.feedback.dto.FeedbackStatusUpdateRequest;
import com.scooter.modules.feedback.service.FeedbackService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/feedback")
public class AdminFeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @PatchMapping("/{feedbackId}/priority")
    public Result<FeedbackResponse> updatePriority(@PathVariable Long feedbackId,
            @Valid @RequestBody FeedbackPriorityUpdateRequest request) {
        return Result.success(feedbackService.updatePriority(feedbackId, request));
    }

    @PatchMapping("/{feedbackId}/status")
    public Result<FeedbackResponse> updateStatus(@PathVariable Long feedbackId,
            @Valid @RequestBody FeedbackStatusUpdateRequest request) {
        return Result.success(feedbackService.updateStatus(feedbackId, request));
    }

    @GetMapping("/high-priority")
    public Result<List<FeedbackResponse>> getHighPriorityFeedback() {
        return Result.success(feedbackService.getHighPriorityFeedback());
    }
}
