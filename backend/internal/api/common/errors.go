// File: internal/apierror/errors.go
package common

import (
    "net/http"
    "strings"
)

// AppError represents a structured error response.
type AppError struct {
    StatusCode int    `json:"statusCode"`
    ErrMsg     string `json:"errMsg"`
}

// Error makes AppError conform to the standard error interface.
func (e AppError) Error() string {
    return e.ErrMsg
}

// NewAppError creates a new AppError with message and aggregated errors
func NewAppError(statusCode int, message string, errs ...error) AppError {
    var errorMessages []string

    errorMessages = append(errorMessages, message)

    for _, err := range errs {
        if err != nil {
            errorMessages = append(errorMessages, err.Error())
        }
    }

    aggregatedMsg := strings.Join(errorMessages, ": ")

    return AppError{
        StatusCode: statusCode,
        ErrMsg:     aggregatedMsg,
    }
}

// Helper functions for common error types
func NewNotFoundError(message string, errs ...error) AppError {
    return NewAppError(http.StatusNotFound, message, errs...)
}

func NewBadRequestError(message string, errs ...error) AppError {
    return NewAppError(http.StatusBadRequest, message, errs...)
}

func NewInternalError(message string, errs ...error) AppError {
    return NewAppError(http.StatusInternalServerError, message, errs...)
}
