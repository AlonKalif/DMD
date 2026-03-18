package crawl

import (
	"dmd/backend/internal/api/common"
	errors2 "dmd/backend/internal/api/common/errors"
	"dmd/backend/internal/api/common/filters"
	"dmd/backend/internal/api/common/utils"
	"dmd/backend/internal/api/handlers"
	"dmd/backend/internal/model/crawl"
	"dmd/backend/internal/platform/storage/repos"
	"dmd/backend/internal/platform/storage/repos/character_template_repo"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

type CharacterTemplateHandler struct {
	handlers.BaseHandler
	repo repos.CharacterTemplateRepository
	log  *slog.Logger
}

func NewCharacterTemplateHandler(rs *common.RoutingServices, path string) common.IHandler {
	return &CharacterTemplateHandler{
		BaseHandler: handlers.NewBaseHandler(path),
		repo:        character_template_repo.NewCharacterTemplateRepository(rs.DbConnection),
		log:         rs.Log,
	}
}

func (h *CharacterTemplateHandler) Get(w http.ResponseWriter, r *http.Request) {
	if _, ok := mux.Vars(r)["id"]; ok {
		h.getByID(w, r)
	} else {
		h.getAll(w, r)
	}
}

func (h *CharacterTemplateHandler) Post(w http.ResponseWriter, r *http.Request) {
	var tmpl crawl.CharacterTemplate
	if err := json.NewDecoder(r.Body).Decode(&tmpl); err != nil {
		utils.RespondWithError(w, errors2.NewBadRequestError("Invalid request body"))
		return
	}
	if err := h.repo.Create(&tmpl); err != nil {
		utils.RespondWithError(w, err)
		return
	}
	utils.RespondWithJSON(w, http.StatusCreated, tmpl)
}

func (h *CharacterTemplateHandler) Put(w http.ResponseWriter, r *http.Request) {
	id, err := utils.GetIDFromRequest(r)
	if err != nil {
		utils.RespondWithError(w, err)
		return
	}

	var tmpl crawl.CharacterTemplate
	if err := json.NewDecoder(r.Body).Decode(&tmpl); err != nil {
		utils.RespondWithError(w, errors2.NewBadRequestError("Invalid request body"))
		return
	}
	tmpl.ID = id

	if err := h.repo.Update(&tmpl); err != nil {
		utils.RespondWithError(w, err)
		return
	}
	utils.RespondWithJSON(w, http.StatusOK, tmpl)
}

func (h *CharacterTemplateHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := utils.GetIDFromRequest(r)
	if err != nil {
		utils.RespondWithError(w, err)
		return
	}
	if err := h.repo.Delete(id); err != nil {
		utils.RespondWithError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *CharacterTemplateHandler) getAll(w http.ResponseWriter, r *http.Request) {
	queryParams := r.URL.Query()
	page, _ := strconv.Atoi(queryParams.Get("page"))
	pageSize, _ := strconv.Atoi(queryParams.Get("pageSize"))

	f := filters.CharacterTemplateFilters{
		Name:     queryParams.Get("name"),
		Type:     queryParams.Get("type"),
		Page:     page,
		PageSize: pageSize,
	}

	templates, err := h.repo.GetAll(f)
	if err != nil {
		utils.RespondWithError(w, err)
		return
	}
	utils.RespondWithJSON(w, http.StatusOK, templates)
}

func (h *CharacterTemplateHandler) getByID(w http.ResponseWriter, r *http.Request) {
	id, err := utils.GetIDFromRequest(r)
	if err != nil {
		utils.RespondWithError(w, err)
		return
	}
	tmpl, err := h.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			utils.RespondWithError(w, errors2.NewNotFoundError("Character template not found"))
			return
		}
		utils.RespondWithError(w, err)
		return
	}
	utils.RespondWithJSON(w, http.StatusOK, tmpl)
}
