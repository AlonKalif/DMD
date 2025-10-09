// File: /internal/services/watcher/dir_watcher_service.go
package watcher

import (
	"log/slog"
	"os"

	"github.com/fsnotify/fsnotify"
)

type OnDirEvent func(event fsnotify.Event) error
type Service struct {
	log        *slog.Logger
	dirToWatch string
	handler    OnDirEvent
}

func NewService(log *slog.Logger, dirToWatch string, handler OnDirEvent) *Service {
	return &Service{log: log, dirToWatch: dirToWatch, handler: handler}
}

// Run creates the watcher and starts the event listener in a background goroutine.
func (s *Service) Run() {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		s.log.Error("Failed to create watcher", "dirToWatch", s.dirToWatch, "error", err)
		os.Exit(1)
	}

	// Start the event listener in the background.
	go s.listenForEvents(watcher)

	// Add the directory to be watched.
	err = watcher.Add(s.dirToWatch)
	if err != nil {
		s.log.Error("Failed to add directory to watcher", "dirToWatch", s.dirToWatch, "error", err)
		os.Exit(1)
	}

	s.log.Info("Watcher started successfully", "dirToWatch", s.dirToWatch)
}

// listenForEvents is the core event loop that blocks and waits for file system events.
func (s *Service) listenForEvents(watcher *fsnotify.Watcher) {
	defer watcher.Close()
	for {
		select {
		case event, ok := <-watcher.Events:
			if !ok {
				return
			}

			s.log.Info("Watcher detected event in directory", "dirToWatch", s.dirToWatch, "event", event.Name)

			if err := s.handler(event); err != nil {
				s.log.Error("Event handler failed", "event", event.Name, "error", err)
			}

		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			s.log.Error("File watcher error", "error", err)
		}
	}
}
