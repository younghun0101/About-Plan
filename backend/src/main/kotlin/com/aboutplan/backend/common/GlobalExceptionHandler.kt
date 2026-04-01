package com.aboutplan.backend.common

import org.springframework.http.ResponseEntity
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(ApiException::class)
    fun handleApiException(exception: ApiException): ResponseEntity<ApiResponse<Nothing>> {
        return ResponseEntity
            .status(exception.status)
            .body(ApiResponses.fail(exception.message))
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationException(
        exception: MethodArgumentNotValidException,
    ): ResponseEntity<ApiResponse<Nothing>> {
        val message =
            exception.bindingResult.allErrors
                .firstOrNull()
                ?.let { error ->
                    if (error is FieldError) {
                        "${error.field}: ${error.defaultMessage}"
                    } else {
                        error.defaultMessage
                    }
                }
                ?: "Validation failed"

        return ResponseEntity.badRequest().body(ApiResponses.fail(message))
    }

    @ExceptionHandler(Exception::class)
    fun handleUnexpectedException(exception: Exception): ResponseEntity<ApiResponse<Nothing>> {
        return ResponseEntity.internalServerError().body(ApiResponses.fail("Internal server error"))
    }
}
