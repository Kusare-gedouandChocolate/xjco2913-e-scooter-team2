package com.scooter.common.exception;

import com.scooter.common.response.Result;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Result<Void>> handleBusinessException(BusinessException e) {
        HttpStatus status = HttpStatus.BAD_REQUEST;

        if (e.getCode().contains("NOT_FOUND"))
            status = HttpStatus.NOT_FOUND;
        if (e.getCode().contains("CONFLICT"))
            status = HttpStatus.CONFLICT;
        if (e.getCode().contains("AUTH"))
            status = HttpStatus.UNAUTHORIZED;

        return ResponseEntity
                .status(status)
                .body(Result.error(e.getCode(), e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Result<Void>> handleGeneralException(Exception e) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Result.error("INTERNAL_ERROR", "An unexpected error occurred"));
    }
}