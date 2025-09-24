package websocket

import (
    "dmd/backend/internal/model/websocket"
    "encoding/json"
    "log/slog"
)

type MessageHandler func(payload json.RawMessage, client *Client)
type Manager struct {
    clients    map[*Client]bool
    broadcast  chan websocket.Event
    register   chan *Client
    unregister chan *Client
    log        *slog.Logger
    handlers   map[string]MessageHandler
}

func NewManager(log *slog.Logger) *Manager {
    m := &Manager{
        clients:    make(map[*Client]bool),
        broadcast:  make(chan websocket.Event),
        register:   make(chan *Client),
        unregister: make(chan *Client),
        log:        log,
        handlers:   make(map[string]MessageHandler),
    }

    m.handlers["send_message"] = m.handleChatMessage

    return m
}

// Run starts the manager's event loop. It must be run in a goroutine.
func (m *Manager) Run() {
    for {
        select {
        case client := <-m.register:
            m.clients[client] = true
            m.log.Info("Client registered", "remote_addr", client.conn.RemoteAddr())
        case client := <-m.unregister:
            if _, ok := m.clients[client]; ok {
                delete(m.clients, client)
                close(client.send)
                m.log.Info("Client unregistered", "remote_addr", client.conn.RemoteAddr())
            }
        case event := <-m.broadcast:
            // Marshal the event to JSON
            messageBytes, err := json.Marshal(event)
            if err != nil {
                m.log.Error("Failed to marshal event", "error", err)
                continue
            }
            // Send the marshaled message to all clients
            for client := range m.clients {
                select {
                case client.send <- messageBytes:
                default:
                    close(client.send)
                    delete(m.clients, client)
                }
            }
        }
    }
}

func (m *Manager) RegisterClient(client *Client) {
    m.register <- client

}

func (m *Manager) handleChatMessage(payload json.RawMessage, client *Client) {
    var chatMessage websocket.ChatMessage
    if err := json.Unmarshal(payload, &chatMessage); err != nil {
        m.log.Warn("Failed to unmarshal chat message", "error", err)
        return
    }

    m.log.Info("Chat message received", "username", chatMessage.Username, "content", chatMessage.Content)

    // Create a new event and send it to the Broadcast channel.
    event := websocket.Event{
        Type:    "new_chat_message",
        Payload: chatMessage,
    }
    m.broadcast <- event
}
