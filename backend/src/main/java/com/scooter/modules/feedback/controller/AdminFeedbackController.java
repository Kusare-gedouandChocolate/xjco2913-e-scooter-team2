package com.scooter.modules.feedback.controller;

import com.scooter.common.response.Result;
import com.scooter.modules.feedback.dto.FeedbackPriorityUpdateRequest;
import com.scooter.modules.feedback.dto.FeedbackResponse;
import com.scooter.modules.feedback.dto.FeedbackStatusUpdateRequest;
import com.scooter.modules.feedback.entity.FeedbackPriority;
import com.scooter.modules.feedback.entity.FeedbackStatus;
import com.scooter.modules.feedback.service.FeedbackService;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
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

    @GetMapping
    public Result<Page<FeedbackResponse>> getAllFeedback(
            @RequestParam(required = false) FeedbackPriority priority,
            @RequestParam(required = false) FeedbackStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<FeedbackResponse> result = feedbackService.getAllFeedback(priority, status, page, size);
        return Result.success(result);
    }
}
