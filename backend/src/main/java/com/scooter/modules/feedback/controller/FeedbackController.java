package com.scooter.modules.feedback.controller;

import com.scooter.common.response.Result;
import com.scooter.modules.feedback.dto.FeedbackCreateRequest;
import com.scooter.modules.feedback.dto.FeedbackResponse;
import com.scooter.modules.feedback.service.FeedbackService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @PostMapping
    public Result<FeedbackResponse> createFeedback(@Valid @RequestBody FeedbackCreateRequest request) {
        return Result.success(feedbackService.createFeedback(request));
    }

    @GetMapping
    public Result<List<FeedbackResponse>> getMyFeedback() {
        return Result.success(feedbackService.getMyFeedback());
    }

    @GetMapping("/{feedbackId}")
    public Result<FeedbackResponse> getMyFeedbackDetail(@PathVariable Long feedbackId) {
        return Result.success(feedbackService.getMyFeedbackDetail(feedbackId));
    }
}
