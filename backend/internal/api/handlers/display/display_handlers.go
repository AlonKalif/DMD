package display

import (
	"dmd/backend/internal/api/common"
	"dmd/backend/internal/api/handlers"
	"log/slog"
)

type DisplayHandler struct {
	handlers.BaseHandler
	log *slog.Logger
}

func NewDisplayHandler(rs *common.RoutingServices, path string) common.IHandler {
	return &DisplayHandler{
		BaseHandler: handlers.NewBaseHandler(path),
		log:         rs.Log,
	}
}
