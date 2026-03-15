package crawl

import (
	"dmd/backend/internal/api/common"
	errors2 "dmd/backend/internal/api/common/errors"
	"dmd/backend/internal/api/common/utils"
	"dmd/backend/internal/api/handlers"
	"dmd/backend/internal/platform/storage/repos"
	"dmd/backend/internal/platform/storage/repos/character_template_repo"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type CharacterTemplatePhotoHandler struct {
	handlers.BaseHandler
	repo       repos.CharacterTemplateRepository
	log        *slog.Logger
	assetsPath string
}

func NewCharacterTemplatePhotoHandler(rs *common.RoutingServices, log *slog.Logger, assetsPath string) *CharacterTemplatePhotoHandler {
	return &CharacterTemplatePhotoHandler{
		BaseHandler: handlers.NewBaseHandler("/crawl/templates/{id}/photo"),
		repo:        character_template_repo.NewCharacterTemplateRepository(rs.DbConnection),
		log:         log,
		assetsPath:  assetsPath,
	}
}

func (h *CharacterTemplatePhotoHandler) Post(w http.ResponseWriter, r *http.Request) {
	id, err := utils.GetIDFromRequest(r)
	if err != nil {
		utils.RespondWithError(w, err)
		return
	}

	tmpl, err := h.repo.GetByID(id)
	if err != nil {
		utils.RespondWithError(w, errors2.NewNotFoundError("Character template not found"))
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		utils.RespondWithError(w, errors2.NewBadRequestError("File too large or invalid form data", err))
		return
	}

	file, header, err := r.FormFile("photo")
	if err != nil {
		utils.RespondWithError(w, errors2.NewBadRequestError("Failed to get photo from request", err))
		return
	}
	defer file.Close()

	contentType := header.Header.Get("Content-Type")
	validTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}
	if !validTypes[contentType] {
		utils.RespondWithError(w, errors2.NewBadRequestError("Invalid file type. Only images (jpg, jpeg, png, gif, webp) are allowed"))
		return
	}

	templatesDir := filepath.Join(h.assetsPath, "images", "templates")
	if err := os.MkdirAll(templatesDir, 0755); err != nil {
		utils.RespondWithError(w, errors2.NewInternalError("Failed to create templates directory", err))
		return
	}

	ext := filepath.Ext(header.Filename)
	filename := fmt.Sprintf("template_%d%s", id, ext)
	savePath := filepath.Join(templatesDir, filename)

	// Remove old photo if it exists with a different extension
	if tmpl.PhotoPath != "" {
		oldPath := filepath.Join(h.assetsPath, tmpl.PhotoPath)
		if oldPath != savePath {
			os.Remove(oldPath)
		}
	}

	dst, err := os.Create(savePath)
	if err != nil {
		utils.RespondWithError(w, errors2.NewInternalError("Failed to create file", err))
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		utils.RespondWithError(w, errors2.NewInternalError("Failed to save file", err))
		return
	}

	relativePath := strings.Join([]string{"images", "templates", filename}, "/")
	tmpl.PhotoPath = relativePath
	if err := h.repo.Update(tmpl); err != nil {
		utils.RespondWithError(w, errors2.NewInternalError("Failed to update template", err))
		return
	}

	h.log.Info("Template photo uploaded", "template_id", id, "filename", filename)

	utils.RespondWithJSON(w, http.StatusOK, tmpl)
}
