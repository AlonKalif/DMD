package audio

import (
    "dmd/backend/internal/api/common"
    "dmd/backend/internal/api/handlers"
    "dmd/backend/internal/model/audio"
    "dmd/backend/internal/platform/storage"
    ws "dmd/backend/internal/services/websocket"
    "encoding/json"
    "errors"
    "github.com/gorilla/mux"
    "gorm.io/gorm"
    "log/slog"
    "net/http"
)

type TracksHandler struct {
    handlers.BaseHandler
    repo      storage.TrackRepository
    log       *slog.Logger
    wsManager *ws.Manager
}

func NewTracksHandler(rs *common.RoutingServices, path string) common.IHandler {
    return &TracksHandler{
        BaseHandler: handlers.NewBaseHandler(path),
        repo:        storage.NewTrackRepository(rs.DbConnection),
        log:         rs.Log,
        wsManager:   rs.WsManager,
    }
}

func (h *TracksHandler) Get(w http.ResponseWriter, r *http.Request) {
    if _, ok := mux.Vars(r)["id"]; ok {
        h.getTrackByID(w, r)
    } else {
        h.getAllTracks(w, r)
    }
}

func (h *TracksHandler) Post(w http.ResponseWriter, r *http.Request) {
    var newTrack audio.Track
    if err := json.NewDecoder(r.Body).Decode(&newTrack); err != nil {
        common.HandleAPIError(w, h.log, common.NewBadRequestError("Invalid request body"))
        return
    }
    if err := h.repo.CreateTrack(&newTrack); err != nil {
        common.HandleAPIError(w, h.log, err)
        return
    }
    common.RespondWithJSON(w, http.StatusCreated, newTrack)
}

// ... (PUT and DELETE methods would go here)

// --- Private Helpers ---
func (h *TracksHandler) getAllTracks(w http.ResponseWriter, r *http.Request) {
    // ... (implementation is correct)
}
func (h *TracksHandler) getTrackByID(w http.ResponseWriter, r *http.Request) {
    id, err := common.GetIDFromRequest(r) // Assumes GetIDFromRequest is in common
    if err != nil {
        common.HandleAPIError(w, h.log, err)
        return
    }
    track, err := h.repo.GetTrackByID(id)
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            common.HandleAPIError(w, h.log, common.NewNotFoundError("Track not found"))
            return
        }
        common.HandleAPIError(w, h.log, err)
        return
    }
    common.RespondWithJSON(w, http.StatusOK, track)
}
