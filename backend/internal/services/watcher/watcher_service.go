// File: /internal/services/watcher/watcher_service.go
package watcher

import (
	"dmd/backend/internal/model/websocket"
	assetService "dmd/backend/internal/services/assets"
	wsService "dmd/backend/internal/services/websocket"
	"log/slog"
	"os"

	"github.com/fsnotify/fsnotify"
)

type Service struct {
	log          *slog.Logger
	assetService *assetService.Service
	wsManager    *wsService.Manager
}

func NewService(log *slog.Logger, assetService *assetService.Service, wsManager *wsService.Manager) *Service {
	return &Service{log: log, assetService: assetService, wsManager: wsManager}
}

// Run creates the watcher and starts the event listener in a background goroutine.
func (s *Service) Run() {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		s.log.Error("Failed to create file watcher", "error", err)
		os.Exit(1)
	}

	// Start the event listener in the background.
	go s.listenForEvents(watcher)

	// Add the directory to be watched.
	err = watcher.Add("./public/images")
	if err != nil {
		s.log.Error("Failed to add directory to watcher", "error", err)
		os.Exit(1)
	}

	s.log.Info("File watcher started successfully", "directory", "./public/images")
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
			if event.Has(fsnotify.Create) || event.Has(fsnotify.Remove) || event.Has(fsnotify.Rename) {
				s.log.Info("Detected change in assets directory", "event", event.Name)

				s.assetService.SyncAssetsWithDatabase()
				s.wsManager.Broadcast(websocket.Event{Type: "assets_updated"})
			}
		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			s.log.Error("File watcher error", "error", err)
		}
	}
}
