package assets

import (
	"dmd/backend/internal/api/common"
	errors2 "dmd/backend/internal/api/common/errors"
	"dmd/backend/internal/api/common/filters"
	"dmd/backend/internal/api/common/utils"
	"dmd/backend/internal/api/handlers"
	"dmd/backend/internal/model/media"
	"dmd/backend/internal/platform/storage"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"gorm.io/gorm"

	"github.com/gorilla/mux"
)

type MediaAssetsHandler struct {
	handlers.BaseHandler
	repo storage.MediaAssetRepository
	log  *slog.Logger
}

func NewMediaAssetsHandler(rs *common.RoutingServices, path string) common.IHandler {
	return &MediaAssetsHandler{
		BaseHandler: handlers.NewBaseHandler(path),
		repo:        storage.NewMediaAssetRepository(rs.DbConnection),
		log:         rs.Log,
	}
}

func (h *MediaAssetsHandler) Get(w http.ResponseWriter, r *http.Request) {
	if _, ok := mux.Vars(r)["id"]; ok {
		h.getMediaAssetByID(w, r)
	} else {
		h.getAllMediaAssets(w, r)
	}
}

func (h *MediaAssetsHandler) Post(w http.ResponseWriter, r *http.Request) {
	var newAsset media.MediaAsset
	if err := json.NewDecoder(r.Body).Decode(&newAsset); err != nil {
		utils.RespondWithError(w, errors2.NewBadRequestError("Invalid request body", err))
		return
	}
	if err := h.repo.CreateMediaAsset(&newAsset); err != nil {
		utils.RespondWithError(w, errors2.NewInternalError("Failed to create media asset", err))
		return
	}
	utils.RespondWithJSON(w, http.StatusCreated, newAsset)
}

func (h *MediaAssetsHandler) Put(w http.ResponseWriter, r *http.Request) {
	id, err := utils.GetIDFromRequest(r)
	if err != nil {
		utils.RespondWithError(w, err)
		return
	}
	var updatedAsset media.MediaAsset
	if err = json.NewDecoder(r.Body).Decode(&updatedAsset); err != nil {
		utils.RespondWithError(w, errors2.NewBadRequestError("Invalid request body", err))
		return
	}
	updatedAsset.ID = id
	if err = h.repo.UpdateMediaAsset(&updatedAsset); err != nil {
		utils.RespondWithError(w, errors2.NewInternalError("Failed to update media asset", err))
		return
	}
	utils.RespondWithJSON(w, http.StatusOK, updatedAsset)
}

func (h *MediaAssetsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := utils.GetIDFromRequest(r)
	if err != nil {
		utils.RespondWithError(w, err)
		return
	}
	if err = h.repo.DeleteMediaAsset(id); err != nil {
		utils.RespondWithError(w, errors2.NewInternalError("Failed to delete media asset", err))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Helper Methods
func (h *MediaAssetsHandler) getAllMediaAssets(w http.ResponseWriter, r *http.Request) {
	queryParams := r.URL.Query()
	page, _ := strconv.Atoi(queryParams.Get("page"))
	pageSize, _ := strconv.Atoi(queryParams.Get("pageSize"))
	filters := filters.MediaAssetFilters{
		Name:     queryParams.Get("name"),
		Type:     queryParams.Get("type"),
		Page:     page,
		PageSize: pageSize,
	}
	assets, err := h.repo.GetAllMediaAssets(filters)
	if err != nil {
		utils.RespondWithError(w, errors2.NewInternalError("Failed to get media assets", err))
		return
	}
	utils.RespondWithJSON(w, http.StatusOK, assets)
}

func (h *MediaAssetsHandler) getMediaAssetByID(w http.ResponseWriter, r *http.Request) {
	id, err := utils.GetIDFromRequest(r)
	if err != nil {
		utils.RespondWithError(w, err)
		return
	}
	asset, err := h.repo.GetMediaAssetByID(id)
	if err != nil {
		appErr := errors2.NewInternalError("Failed to get asset by id", err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			appErr.StatusCode = http.StatusNotFound
		}
		utils.RespondWithError(w, appErr)
		return
	}
	utils.RespondWithJSON(w, http.StatusOK, asset)
}
