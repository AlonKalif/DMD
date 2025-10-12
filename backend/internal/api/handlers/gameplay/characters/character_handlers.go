package characters

import (
	"dmd/backend/internal/api/common"
	errors2 "dmd/backend/internal/api/common/errors"
	"dmd/backend/internal/api/common/filters"
	"dmd/backend/internal/api/common/utils"
	"dmd/backend/internal/api/handlers"
	"dmd/backend/internal/model/character"
	"dmd/backend/internal/platform/storage/repos"
	"dmd/backend/internal/platform/storage/repos/character_repo"
	ws "dmd/backend/internal/services/websocket"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"gorm.io/gorm"

	"github.com/gorilla/mux"
)

type CharactersHandler struct {
	handlers.BaseHandler
	repo      repos.CharacterRepository
	log       *slog.Logger
	wsManager *ws.Manager
}

func NewCharactersHandler(rs *common.RoutingServices, path string) common.IHandler {
	return &CharactersHandler{
		BaseHandler: handlers.NewBaseHandler(path),
		repo:        character_repo.NewCharacterRepository(rs.DbConnection),
		log:         rs.Log,
		wsManager:   rs.WsManager,
	}
}

// Public Methods
func (h *CharactersHandler) Get(w http.ResponseWriter, r *http.Request) {
	if _, ok := mux.Vars(r)["id"]; ok {
		h.getCharacterByID(w, r)
	} else {
		h.getAllCharacters(w, r)
	}
}

func (h *CharactersHandler) Post(w http.ResponseWriter, r *http.Request) {
	var newChar character.Character
	if err := json.NewDecoder(r.Body).Decode(&newChar); err != nil {
		utils.RespondWithError(w, errors2.NewBadRequestError("Invalid request body"))
		return
	}
	if err := h.repo.CreateCharacter(&newChar); err != nil {
		utils.RespondWithError(w, err)
		return
	}
	utils.RespondWithJSON(w, http.StatusCreated, newChar)
}

func (h *CharactersHandler) Put(w http.ResponseWriter, r *http.Request) {
	id, err := utils.GetIDFromRequest(r)
	if err != nil {
		utils.RespondWithError(w, err)
		return
	}

	var updatedChar character.Character
	if err := json.NewDecoder(r.Body).Decode(&updatedChar); err != nil {
		utils.RespondWithError(w, errors2.NewBadRequestError("Invalid request body"))
		return
	}
	updatedChar.ID = id

	if err := h.repo.UpdateCharacter(&updatedChar); err != nil {
		utils.RespondWithError(w, err)
		return
	}
	utils.RespondWithJSON(w, http.StatusOK, updatedChar)
}

func (h *CharactersHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := utils.GetIDFromRequest(r)
	if err != nil {
		utils.RespondWithError(w, err)
		return
	}
	if err := h.repo.DeleteCharacter(id); err != nil {
		utils.RespondWithError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Helper Methods
func (h *CharactersHandler) getAllCharacters(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters from the URL
	queryParams := r.URL.Query()

	page, _ := strconv.Atoi(queryParams.Get("page"))
	pageSize, _ := strconv.Atoi(queryParams.Get("pageSize"))

	// Populate the filters struct
	filters := filters.CharacterFilters{
		Name:     queryParams.Get("name"),
		Class:    queryParams.Get("class"),
		Page:     page,
		PageSize: pageSize,
	}

	// Pass the filters to the repository
	chars, err := h.repo.GetAllCharacters(filters)
	if err != nil {
		utils.RespondWithError(w, err)
		return
	}
	utils.RespondWithJSON(w, http.StatusOK, chars)
}

func (h *CharactersHandler) getCharacterByID(w http.ResponseWriter, r *http.Request) {
	id, err := utils.GetIDFromRequest(r)
	if err != nil {
		utils.RespondWithError(w, err)
		return
	}
	char, err := h.repo.GetCharacterByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			utils.RespondWithError(w, errors2.NewNotFoundError("Character not found"))
			return
		}
		utils.RespondWithError(w, err)
		return
	}
	utils.RespondWithJSON(w, http.StatusOK, char)
}
