package images

import (
	"dmd/backend/internal/api/common"
	errors2 "dmd/backend/internal/api/common/errors"
	"dmd/backend/internal/api/common/utils"
	"dmd/backend/internal/api/handlers"
	"dmd/backend/internal/model/images"
	"dmd/backend/internal/platform/storage/repos"
	"dmd/backend/internal/platform/storage/repos/images_repo"
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/gorilla/mux"
)

type PresetHandler struct {
	handlers.BaseHandler
	repo repos.ImagesRepository
	log  *slog.Logger
}

func NewPresetHandler(rs *common.RoutingServices, path string) common.IHandler {
	return &PresetHandler{
		BaseHandler: handlers.NewBaseHandler(path),
		repo:        images_repo.NewImagesRepository(rs.DbConnection),
		log:         rs.Log,
	}
}

func (h *PresetHandler) Get(w http.ResponseWriter, r *http.Request) {
	presets, err := h.repo.GetAllPresets()
	if err != nil {
		utils.RespondWithError(w, errors2.NewInternalError("Failed to get presets", err))
		return
	}
	utils.RespondWithJSON(w, http.StatusOK, presets)
}

func (h *PresetHandler) Post(w http.ResponseWriter, r *http.Request) {
	var newPreset images.PresetLayout
	if err := json.NewDecoder(r.Body).Decode(&newPreset); err != nil {
		utils.RespondWithError(w, errors2.NewBadRequestError("Invalid request body", err))
		return
	}
	if err := h.repo.CreatePreset(&newPreset); err != nil {
		utils.RespondWithError(w, errors2.NewInternalError("Failed to create preset", err))
		return
	}
	utils.RespondWithJSON(w, http.StatusCreated, newPreset)
}

func (h *PresetHandler) Delete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := utils.GetIDFromRequest(r)
	if err != nil {
		utils.RespondWithError(w, err)
		return
	}
	
	// Verify the ID is in the URL path
	if _, ok := vars["id"]; !ok {
		utils.RespondWithError(w, errors2.NewBadRequestError("Missing preset ID in URL", nil))
		return
	}
	
	if err = h.repo.DeletePreset(id); err != nil {
		utils.RespondWithError(w, errors2.NewInternalError("Failed to delete preset", err))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *PresetHandler) Put(w http.ResponseWriter, r *http.Request) {
	// PUT method not supported for presets
	w.WriteHeader(http.StatusMethodNotAllowed)
}

