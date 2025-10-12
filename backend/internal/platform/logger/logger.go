// File: internal/logger/logger.go

package logger

import (
	"os"

	"github.com/lmittmann/tint"
	"log/slog"
)

//func New() *slog.Logger {
//    // Create a handler that writes logs in JSON format to the standard output.
//    handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
//        Level: slog.LevelDebug,
//    })
//
//    return slog.New(handler)
//}

//func New() *slog.Logger {
//    // Create a handler that writes logs in JSON format to the standard output.
//    handler := slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
//        Level: slog.LevelDebug,
//    })
//
//    return slog.New(handler)
//}

func New() *slog.Logger {
	// Enables colors by default if the output is a TTY (terminal).
	handler := tint.NewHandler(os.Stdout, &tint.Options{
		Level:      slog.LevelDebug,
		TimeFormat: "15:04:05",

		//AddSource: true, // Show log source file path
		//TimeFormat: "2006-01-02 15:04:05",
	})

	return slog.New(handler)
}
