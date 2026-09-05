package com.kaizen.common;

import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Turns everything the controllers can throw into {@link ApiError}. Nothing
 * here leaks a stack trace or a SQL message to the client.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiError> handleApi(ApiException ex) {
        return ResponseEntity.status(ex.status()).body(new ApiError(ex.getMessage()));
    }

    /** Bean-validation failures on a @Valid request body. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleInvalid(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getDefaultMessage() == null ? error.getField() : error.getDefaultMessage())
                .distinct()
                .collect(Collectors.joining(" "));
        return ResponseEntity.badRequest()
                .body(new ApiError(message.isBlank() ? "That request is not valid." : message));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(new ApiError(ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleAnythingElse(Exception ex) {
        // Spring's own 404s, 405s and unsupported media types already carry the
        // right status - keep it rather than reporting them as server faults.
        if (ex instanceof ErrorResponse spring) {
            HttpStatus status = HttpStatus.valueOf(spring.getStatusCode().value());
            return ResponseEntity.status(status).body(new ApiError(status.getReasonPhrase()));
        }
        log.error("Unhandled failure", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError("Something went wrong."));
    }
}
