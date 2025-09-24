// File: internal/handler/utils.go
package common

import (
    "encoding/json"
    "errors"
    "github.com/gorilla/mux"
    "log/slog"
    "net/http"
    "strconv"
)

// respondWithError sends a JSON error message.
func RespondWithError(w http.ResponseWriter, code int, message string) {
    RespondWithJSON(w, code, map[string]string{"error": message})
}

// respondWithJSON writes a JSON response.
func RespondWithJSON(w http.ResponseWriter, code int, payload any) {
    response, err := json.Marshal(payload)
    if err != nil {
        // If marshaling fails, it's a server error.
        w.WriteHeader(http.StatusInternalServerError)
        w.Write([]byte("Internal Server Error"))
        return
    }
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(code)
    w.Write(response)
}

// HandleAPIError centralizes the logic for processing and responding to errors.
func HandleAPIError(w http.ResponseWriter, log *slog.Logger, err error) {
    var apiErr APIError
    // Check if the error is our custom APIError type.
    if errors.As(err, &apiErr) {
        // It's a known, categorized error. Respond with its specific details.
        RespondWithError(w, apiErr.StatusCode, apiErr.Message)
    } else {
        // It's an unexpected, internal error.
        // Log the full error for debugging, but send a generic response to the client.
        log.Error("Unhandled internal error", "error", err)
        RespondWithError(w, http.StatusInternalServerError, "Internal Server Error")
    }
}

// Helper Functions
func GetIDFromRequest(r *http.Request) (uint, error) {
    vars := mux.Vars(r)
    idStr, ok := vars["id"]
    if !ok {
        return 0, NewBadRequestError("Missing character ID")
    }
    id, err := strconv.Atoi(idStr)
    if err != nil {
        return 0, NewBadRequestError("Invalid character ID")
    }
    return uint(id), nil
}
