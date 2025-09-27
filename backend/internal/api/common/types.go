package common

import (
    wsService "dmd/backend/internal/services/websocket"
    "gorm.io/gorm"
    "log/slog"
    "net/http"
)

type IHandler interface {
    Get(w http.ResponseWriter, r *http.Request)
    Put(w http.ResponseWriter, r *http.Request)
    Post(w http.ResponseWriter, r *http.Request)
    Delete(w http.ResponseWriter, r *http.Request)
    GetPath() string
}
type HandlerCreator func(rs *RoutingServices, path string) IHandler

type RoutingServices struct {
    Log          *slog.Logger
    DbConnection *gorm.DB
    WsManager    *wsService.Manager
}
