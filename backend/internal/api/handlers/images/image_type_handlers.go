package images

import (
	"dmd/backend/internal/api/common"
	errors2 "dmd/backend/internal/api/common/errors"
	"dmd/backend/internal/api/common/utils"
	"dmd/backend/internal/api/handlers"
	"dmd/backend/internal/platform/storage/repos"
	"dmd/backend/internal/platform/storage/repos/images_repo"
	"log/slog"
	"net/http"
)

type ImageTypeHandler struct {
	handlers.BaseHandler
	repo repos.ImagesRepository
	log  *slog.Logger
}

func NewImageTypeHandler(rs *common.RoutingServices, path string) common.IHandler {
	return &ImageTypeHandler{
		BaseHandler: handlers.NewBaseHandler(path),
		repo:        images_repo.NewImagesRepository(rs.DbConnection),
		log:         rs.Log,
	}
}

func (h *ImageTypeHandler) Get(w http.ResponseWriter, r *http.Request) {
	types, err := h.repo.GetAllTypes()
	if err != nil {
		utils.RespondWithError(w, errors2.NewInternalError("Failed to get image types", err))
		return
	}

	if types == nil {
		types = []string{}
	}

	utils.RespondWithJSON(w, http.StatusOK, types)
}
