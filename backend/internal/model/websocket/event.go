// File: internal/model/websocket_event.go
package websocket

// Event is the structure for all outgoing WebSocket messages from the server.
type Event struct {
    Type    string `json:"type"`
    Payload any    `json:"payload"`
}
