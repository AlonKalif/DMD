package websocket

import (
	"dmd/backend/internal/api/common"
	"dmd/backend/internal/api/common/errors"
	"dmd/backend/internal/api/common/utils"
	"dmd/backend/internal/api/handlers"
	wsService "dmd/backend/internal/services/websocket"
	"log/slog"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// return r.Header.Get("Origin") == "http://localhost:3000"
		return true // Allow all origins for development
	},
}

type WebsocketHandler struct {
	handlers.BaseHandler
	log     *slog.Logger
	manager *wsService.Manager
}

func NewWebsocketHandler(rs *common.RoutingServices, path string) common.IHandler {
	return &WebsocketHandler{
		BaseHandler: handlers.NewBaseHandler(path),
		log:         rs.Log,
		manager:     rs.WsManager,
	}
}

// Get Upgrades connection, creates new client, register to manager
func (ws *WebsocketHandler) Get(w http.ResponseWriter, r *http.Request) {
	newConn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		ws.log.Error("Failed to upgrade to ws connection", "error", err)
		utils.RespondWithError(w, errors.NewInternalError(err.Error()))
		return
	}
	newClient := wsService.NewClient(newConn, ws.manager)

	ws.manager.RegisterClient(newClient)

	utils.RespondWithJSON(w, http.StatusOK, "websocket connection started")
}
