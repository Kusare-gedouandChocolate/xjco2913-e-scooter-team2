package com.scooter.common.exception;

import com.scooter.common.response.Result;
import com.scooter.common.web.RequestContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Result<Void>> handleBusinessException(BusinessException e) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        if (e.getCode().contains("NOT_FOUND")) {
            status = HttpStatus.NOT_FOUND;
        }
        if (e.getCode().contains("CONFLICT")) {
            status = HttpStatus.CONFLICT;
        }
        if (e.getCode().contains("AUTH")) {
            status = HttpStatus.UNAUTHORIZED;
        }
        if (e.getCode().contains("FORBIDDEN")) {
            status = HttpStatus.FORBIDDEN;
        }

        log.warn("requestId={} businessError code={} status={} message={}",
                RequestContext.getOrCreateRequestId(), e.getCode(), status.value(), e.getMessage());

        return ResponseEntity.status(status).body(Result.error(e.getCode(), e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Result<Void>> handleValidationException(MethodArgumentNotValidException e) {
        String message = "Request validation failed";
        FieldError fieldError = e.getBindingResult().getFieldError();
        if (fieldError != null && fieldError.getDefaultMessage() != null) {
            message = fieldError.getDefaultMessage();
        }

        List<Result.ErrorItem> errors = e.getBindingResult().getFieldErrors().stream()
                .map(item -> new Result.ErrorItem(item.getField(), item.getDefaultMessage()))
                .toList();

        log.warn("requestId={} validationError count={} message={}",
                RequestContext.getOrCreateRequestId(), errors.size(), message);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Result.error("VALIDATION_ERROR", message, errors));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Result<Void>> handleJsonParseException(HttpMessageNotReadableException e) {
        log.warn("requestId={} invalidRequestBody cause={}",
                RequestContext.getOrCreateRequestId(), e.getMostSpecificCause().getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Result.error("INVALID_REQUEST_BODY", "Malformed JSON request body"));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Result<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        String parameterName = e.getName() != null ? e.getName() : "request parameter";
        log.warn("requestId={} invalidRequestParameter name={} value={}",
                RequestContext.getOrCreateRequestId(), parameterName, e.getValue());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Result.error("INVALID_REQUEST_PARAMETER", "Invalid value for parameter: " + parameterName));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Result<Void>> handleGeneralException(Exception e) {
        log.error("requestId={} unexpectedError", RequestContext.getOrCreateRequestId(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Result.error("INTERNAL_ERROR", "An unexpected internal error occurred"));
    }
}
