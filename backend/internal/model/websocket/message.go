// File: internal/model/websocket_message.go
package websocket

import "encoding/json"

// Message is the structure for all incoming WebSocket messages.
type Message struct {
    Type    string          `json:"type"`
    Payload json.RawMessage `json:"payload"`
}

// ChatMessage is the payload for a 'send_message' type.
type ChatMessage struct {
    Username string `json:"username"`
    Content  string `json:"content"`
}
