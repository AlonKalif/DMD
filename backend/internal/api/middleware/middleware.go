package middleware

import (
    "dmd/backend/internal/api/common"
    "log/slog"
    "net/http"
    "time"
)

func Logging(logger *slog.Logger) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()

            // Serve the next handler in the chain.
            next.ServeHTTP(w, r)

            logger.Info("Request handled",
                "method", r.Method,
                "path", r.URL.Path,
                "remote_addr", r.RemoteAddr,
                "duration", time.Since(start),
            )
        })
    }
}

func Recovery(log *slog.Logger) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            defer func() {
                if err := recover(); err != nil {
                    log.Error("Panic recovered", "error", err)
                    common.RespondWithError(w, http.StatusInternalServerError, "Something went wrong")
                }
            }()
            next.ServeHTTP(w, r)
        })
    }
}
