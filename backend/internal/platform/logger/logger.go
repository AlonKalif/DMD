// File: internal/logger/logger.go

package logger

import (
    "log/slog"
    "os"
)

//func New() *slog.Logger {
//    // Create a handler that writes logs in JSON format to the standard output.
//    handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
//        Level: slog.LevelDebug,
//    })
//
//    return slog.New(handler)
//}

func New() *slog.Logger {
    // Create a handler that writes logs in JSON format to the standard output.
    handler := slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelDebug,
    })

    return slog.New(handler)
}
