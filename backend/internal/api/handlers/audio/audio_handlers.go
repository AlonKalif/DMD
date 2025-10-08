package audio

import (
	"dmd/backend/internal/api/common"
	"dmd/backend/internal/api/handlers"
	"log/slog"
)

type AudioHandler struct {
	handlers.BaseHandler
	log *slog.Logger
}

func NewAudioHandler(rs *common.RoutingServices, path string) common.IHandler {
	return &AudioHandler{
		BaseHandler: handlers.NewBaseHandler(path),
		log:         rs.Log,
	}
}
