package com.scooter.common.exception;

import com.scooter.common.response.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Global exception handler to ensure all errors follow the unified response
 * format.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle custom business exceptions (e.g., Email already exists).
     */
    @ExceptionHandler(BusinessException.class)
    public Result<?> handleBusinessException(BusinessException e) {
        return Result.error(e.getCode(), e.getMessage());
    }

    /**
     * Handle validation errors from @Valid (e.g., Invalid email format).
     * This fulfills the requirement for "Clear error codes and messages for invalid
     * input".
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<?> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldError().getDefaultMessage();
        return Result.error("VALIDATION_ERROR", message);
    }

    /**
     * Catch-all handler for unexpected internal server errors.
     */
    @ExceptionHandler(Exception.class)
    public Result<?> handleGeneralException(Exception e) {
        log.error("Unexpected error occurred: ", e);
        return Result.error("INTERNAL_SERVER_ERROR", "An unexpected error occurred on the server.");
    }
}