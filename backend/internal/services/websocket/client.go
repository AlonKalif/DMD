// File: internal/handler/websocket_handler.go
package websocket

import (
	websocket2 "dmd/backend/internal/model/websocket"
	"encoding/json"

	"github.com/gorilla/websocket"
)

// Client represents a single WebSocket connection.
type Client struct {
	conn    *websocket.Conn
	manager *Manager
	send    chan []byte
}

func NewClient(conn *websocket.Conn, manager *Manager) *Client {
	client := &Client{
		conn:    conn,
		manager: manager,
		send:    make(chan []byte, 256),
	}

	return client
}

// ReadPump pumps messages from the WebSocket connection to the manager.
func (c *Client) ReadPump() {
	defer func() {
		c.manager.unregister <- c
		c.conn.Close()
	}()

	for {
		_, messageBytes, err := c.conn.ReadMessage()
		if err != nil {
			c.manager.log.Error("ReadPump error", "error", err, "msg", string(messageBytes))
			break
		}

		var msg websocket2.Message
		if err := json.Unmarshal(messageBytes, &msg); err != nil {
			c.manager.log.Warn("Failed to unmarshal message", "error", err)
			continue
		}

		// Find the handler for the message type and execute it.
		if handler, ok := c.manager.handlers[msg.Type]; ok {
			handler(msg.Payload, c)
		} else {
			c.manager.log.Warn("Unknown message type received", "type", msg.Type)
		}
	}
}

// WritePump pumps messages from the manager to the WebSocket connection.
func (c *Client) WritePump() {
	defer c.conn.Close()
	for message := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
			c.manager.log.Warn("WritePump error", "error", err)
			break
		}
	}
}
