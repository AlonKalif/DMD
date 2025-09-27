package audio

import (
    "dmd/backend/internal/api/common"
    "dmd/backend/internal/api/handlers"
    "dmd/backend/internal/model/audio"
    "dmd/backend/internal/platform/storage"
    "encoding/json"
    "errors"
    "github.com/gorilla/mux"
    "gorm.io/gorm"
    "log/slog"
    "net/http"
    "strconv"
)

type TracksHandler struct {
    handlers.BaseHandler
    repo storage.TrackRepository
    log  *slog.Logger
}

func NewTracksHandler(rs *common.RoutingServices, path string) common.IHandler {
    return &TracksHandler{
        BaseHandler: handlers.NewBaseHandler(path),
        repo:        storage.NewTrackRepository(rs.DbConnection),
        log:         rs.Log,
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
        common.RespondWithError(w, common.NewBadRequestError("Invalid request body", err))
        return
    }
    if err := h.repo.CreateTrack(&newTrack); err != nil {
        common.RespondWithError(w, common.NewInternalError("Failed to create new track", err))
        return
    }
    common.RespondWithJSON(w, http.StatusCreated, newTrack)
}

// --- Private Helpers ---
func (h *TracksHandler) getAllTracks(w http.ResponseWriter, r *http.Request) {
    queryParams := r.URL.Query()
    page, _ := strconv.Atoi(queryParams.Get("page"))
    pageSize, _ := strconv.Atoi(queryParams.Get("pageSize"))

    filters := common.TrackFilters{
        Title:    queryParams.Get("title"),
        Artist:   queryParams.Get("artist"),
        Source:   queryParams.Get("source"),
        Page:     page,
        PageSize: pageSize,
    }

    tracks, err := h.repo.GetAllTracks(filters)
    if err != nil {
        common.RespondWithError(w, common.NewInternalError("Failed to fetch tracks from db", err))
        return
    }
    common.RespondWithJSON(w, http.StatusOK, tracks)
}

func (h *TracksHandler) getTrackByID(w http.ResponseWriter, r *http.Request) {
    id, err := common.GetIDFromRequest(r) // Assumes GetIDFromRequest is in common
    if err != nil {
        common.RespondWithError(w, err)
        return
    }
    track, err := h.repo.GetTrackByID(id)
    if err != nil {
        appErr := common.NewInternalError("Failed to get track by id", err)
        if errors.Is(err, gorm.ErrRecordNotFound) {
            appErr.StatusCode = http.StatusNotFound
        }
        common.RespondWithError(w, appErr)
        return
    }
    common.RespondWithJSON(w, http.StatusOK, track)
}
