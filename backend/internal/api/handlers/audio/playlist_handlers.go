// File: /internal/api/handlers/audio/playlist_handlers.go
package audio

import (
	"dmd/backend/internal/api/common"
	"dmd/backend/internal/api/common/errors"
	"dmd/backend/internal/api/common/utils"
	"dmd/backend/internal/api/handlers"
	"dmd/backend/internal/model/audio"
	"dmd/backend/internal/platform/storage"
	"encoding/json"
	"log/slog"
	"net/http"
)

type PlaylistsHandler struct {
	handlers.BaseHandler
	repo storage.PlaylistRepository
	log  *slog.Logger
}

func NewPlaylistsHandler(rs *common.RoutingServices, path string) common.IHandler {
	return &PlaylistsHandler{
		BaseHandler: handlers.NewBaseHandler(path),
		repo:        storage.NewPlaylistRepository(rs.DbConnection),
		log:         rs.Log,
	}
}

// Custom request struct for creating a playlist
type createPlaylistRequest struct {
	Name        string `gorm:"not null;unique" json:"name"`
	Description string `json:"description"`
	TrackIDs    []uint `json:"track_ids"`
}

func (h *PlaylistsHandler) Post(w http.ResponseWriter, r *http.Request) {
	var req createPlaylistRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, errors.NewBadRequestError("Invalid request body", err))
		return
	}

	playlist := &audio.Playlist{
		Name:        req.Name,
		Description: req.Description,
	}

	createdPlaylist, err := h.repo.CreatePlaylist(playlist, req.TrackIDs)
	if err != nil {
		utils.RespondWithError(w, errors.NewInternalError("Failed to create playlist", err))
		return
	}
	utils.RespondWithJSON(w, http.StatusCreated, createdPlaylist)
}
