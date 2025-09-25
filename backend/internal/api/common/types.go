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

type RoutingServices struct {
    Log          *slog.Logger
    DbConnection *gorm.DB
    WsManager    *wsService.Manager
}

type HandlerCreator func(rs *RoutingServices, path string) IHandler

// CharacterFilters defines the available query parameters for filtering characters.
type CharacterFilters struct {
    Name     string
    Class    string
    Page     int
    PageSize int
}

// NPCFilters defines the available query parameters for filtering NPCs.
type NPCFilters struct {
    Name     string
    Type     string
    Race     string
    Page     int
    PageSize int
}

type ItemFilters struct {
    Name     string
    Type     string
    Rarity   string
    Page     int
    PageSize int
}

type SpellFilters struct {
    Name            string
    Level           *int // Use a pointer to distinguish between 0 and not provided
    School          string
    IsConcentration *bool // Use a pointer for boolean filtering
    Page            int
    PageSize        int
}

type TrackFilters struct {
    Title    string
    Artist   string
    Source   string
    Page     int
    PageSize int
}
