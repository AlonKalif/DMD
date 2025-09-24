package system

import (
    "dmd/backend/internal/api/common"
    "dmd/backend/internal/api/handlers"
    "log/slog"
)

type SystemHandler struct {
    handlers.BaseHandler
    log *slog.Logger
}

func NewSystemHandler(rs *common.RoutingServices, path string) common.IHandler {
    return &SystemHandler{
        BaseHandler: handlers.NewBaseHandler(path),
        log:         rs.Log,
    }
}
