// File: internal/apierror/errors.go
package common

import "net/http"

// APIError represents a structured error response.
type APIError struct {
    StatusCode int    `json:"statusCode"`
    Message    string `json:"message"`
}

// Error makes APIError conform to the standard error interface.
func (e APIError) Error() string {
    return e.Message
}

// NewAPIError creates a new APIError.
func NewAPIError(statusCode int, message string) APIError {
    return APIError{StatusCode: statusCode, Message: message}
}

// Helper functions for common error types
func NewNotFoundError(message string) APIError {
    return NewAPIError(http.StatusNotFound, message)
}

func NewBadRequestError(message string) APIError {
    return NewAPIError(http.StatusBadRequest, message)
}

func NewInternalServerError() APIError {
    return NewAPIError(http.StatusInternalServerError, "An unexpected error occurred")
}
