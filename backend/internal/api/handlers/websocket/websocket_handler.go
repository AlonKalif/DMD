// File: /internal/api/handlers/websocket/websocket_handler.go
package websocket

import (
	wsService "dmd/backend/internal/services/websocket"
	"log/slog"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

// RegisterWebsocketRoutes sets up the dedicated WebSocket endpoint on the main router.
func RegisterWebsocketRoutes(router *mux.Router, log *slog.Logger, manager *wsService.Manager) {
	router.HandleFunc("/ws", serveWs(log, manager))
}

// serveWs returns a standard http.HandlerFunc that handles the WebSocket upgrade.
func serveWs(log *slog.Logger, manager *wsService.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Upgrade the HTTP connection to a WebSocket connection.
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			// The upgrader automatically sends an HTTP error response,
			// so we just need to log the error and return.
			log.Error("Failed to upgrade connection", "error", err)
			return
		}

		// Create a new client and register it with the manager.
		client := wsService.NewClient(conn, manager)
		manager.RegisterClient(client)

		// Start the goroutines to handle reading and writing for this client.
		go client.WritePump()
		go client.ReadPump()

	}
}
