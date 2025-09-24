package routes

import (
    "dmd/backend/internal/api/common"
    "io"
    "log/slog"
    "net/http"
    "net/http/httptest"
    "testing"

    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

// setupTestRouter is a helper to create a full router with mock/test dependencies.
func setupTestRouter(t *testing.T) http.Handler {
    log := slog.New(slog.NewTextHandler(io.Discard, nil))

    db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
    if err != nil {
        t.Fatalf("failed to connect to in-memory database: %v", err)
    }

    // WsManager can be nil for this test as the health check doesn't use it.
    routingServices := &common.RoutingServices{
        Log:          log,
        DbConnection: db,
        WsManager:    nil,
    }

    return NewRouter(routingServices)
}

// --- Main Test Function ---

func TestHealthCheckRoute(t *testing.T) {
    // 1. Create a complete router instance for testing.
    router := setupTestRouter(t)

    // 2. Create the test request and response recorder.
    req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
    rr := httptest.NewRecorder()

    // 3. Serve the request using the router.
    // This simulates a real HTTP request coming into your application.
    router.ServeHTTP(rr, req)

    // 4. Assert the results.
    if status := rr.Code; status != http.StatusOK {
        t.Errorf("handler returned wrong status code: got %v want %v",
            status, http.StatusOK)
    }

    expected := `{"status":"ok"}`
    body := rr.Body.String()
    // Trim newline from the body for consistent comparison
    if len(body) > 0 && body[len(body)-1] == '\n' {
        body = body[:len(body)-1]
    }

    if body != expected {
        t.Errorf("handler returned unexpected body: got %v want %v",
            body, expected)
    }
}
