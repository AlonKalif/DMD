package spells

import (
	"dmd/backend/internal/api/common"
	"dmd/backend/internal/api/handlers"
	"dmd/backend/internal/model/gameplay"
	"dmd/backend/internal/platform/storage"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"gorm.io/gorm"

	"github.com/gorilla/mux"
)

type SpellsHandler struct {
	handlers.BaseHandler
	repo storage.SpellRepository
	log  *slog.Logger
}

func NewSpellsHandler(rs *common.RoutingServices, path string) common.IHandler {
	return &SpellsHandler{
		BaseHandler: handlers.NewBaseHandler(path),
		repo:        storage.NewSpellRepository(rs.DbConnection),
		log:         rs.Log,
	}
}

// --- Public Methods (from IHandler interface) ---

func (h *SpellsHandler) Get(w http.ResponseWriter, r *http.Request) {
	if _, ok := mux.Vars(r)["id"]; ok {
		h.getSpellByID(w, r)
	} else {
		h.getAllSpells(w, r)
	}
}

func (h *SpellsHandler) Post(w http.ResponseWriter, r *http.Request) {
	var newSpell gameplay.Spell
	if err := json.NewDecoder(r.Body).Decode(&newSpell); err != nil {
		common.RespondWithError(w, common.NewBadRequestError("Invalid request body"))
		return
	}
	if err := h.repo.CreateSpell(&newSpell); err != nil {
		common.RespondWithError(w, err)
		return
	}
	common.RespondWithJSON(w, http.StatusCreated, newSpell)
}

func (h *SpellsHandler) Put(w http.ResponseWriter, r *http.Request) {
	id, err := common.GetIDFromRequest(r)
	if err != nil {
		common.RespondWithError(w, err)
		return
	}
	var updatedSpell gameplay.Spell
	if err := json.NewDecoder(r.Body).Decode(&updatedSpell); err != nil {
		common.RespondWithError(w, common.NewBadRequestError("Invalid request body"))
		return
	}
	updatedSpell.ID = id
	if err := h.repo.UpdateSpell(&updatedSpell); err != nil {
		common.RespondWithError(w, err)
		return
	}
	common.RespondWithJSON(w, http.StatusOK, updatedSpell)
}

func (h *SpellsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := common.GetIDFromRequest(r)
	if err != nil {
		common.RespondWithError(w, err)
		return
	}
	if err := h.repo.DeleteSpell(id); err != nil {
		common.RespondWithError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// --- Private Helper Methods ---
func (h *SpellsHandler) getAllSpells(w http.ResponseWriter, r *http.Request) {
	queryParams := r.URL.Query()
	filters := common.SpellFilters{
		Name:   queryParams.Get("name"),
		School: queryParams.Get("school"),
	}
	// Safely parse integer and boolean query parameters
	if levelStr := queryParams.Get("level"); levelStr != "" {
		if level, err := strconv.Atoi(levelStr); err == nil {
			filters.Level = &level
		}
	}
	if concStr := queryParams.Get("concentration"); concStr != "" {
		if conc, err := strconv.ParseBool(concStr); err == nil {
			filters.IsConcentration = &conc
		}
	}

	spells, err := h.repo.GetAllSpells(filters)
	if err != nil {
		common.RespondWithError(w, err)
		return
	}
	common.RespondWithJSON(w, http.StatusOK, spells)
}

func (h *SpellsHandler) getSpellByID(w http.ResponseWriter, r *http.Request) {
	id, err := common.GetIDFromRequest(r)
	if err != nil {
		common.RespondWithError(w, err)
		return
	}
	spell, err := h.repo.GetSpellByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			common.RespondWithError(w, common.NewNotFoundError("Spell not found"))
			return
		}
		common.RespondWithError(w, err)
		return
	}
	common.RespondWithJSON(w, http.StatusOK, spell)
}
