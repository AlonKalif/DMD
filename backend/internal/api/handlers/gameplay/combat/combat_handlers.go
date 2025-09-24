package combat

import (
    "dmd/backend/internal/api/common"
    "dmd/backend/internal/api/handlers"
    "log/slog"
)

type CombatHandler struct {
    handlers.BaseHandler
    log *slog.Logger
}

func NewCombatHandler(rs *common.RoutingServices, path string) common.IHandler {
    return &CombatHandler{
        BaseHandler: handlers.NewBaseHandler(path),
        log:         rs.Log,
    }
}
