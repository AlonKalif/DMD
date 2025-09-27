// File: internal/handler/utils.go
package common

import (
    "encoding/json"
    "errors"
    "github.com/gorilla/mux"
    "net/http"
    "strconv"
)

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

// RespondWithError centralizes the logic for processing and responding to errors.
func RespondWithError(w http.ResponseWriter, err error) {
    var apiErr AppError
    statusCode := http.StatusInternalServerError
    if errors.As(err, &apiErr) {
        statusCode = apiErr.StatusCode
    }
    RespondWithJSON(w, statusCode, map[string]string{"error": err.Error()})
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
        return 0, NewBadRequestError("Invalid character ID", err)
    }
    return uint(id), nil
}
