// File: /internal/api/handlers/gameplay/abilities/ability_handlers.go
package abilities

import (
	"dmd/backend/internal/api/common"
	"dmd/backend/internal/api/common/errors"
	"dmd/backend/internal/api/common/utils"
	"dmd/backend/internal/api/handlers"
	"dmd/backend/internal/model/character"
	"dmd/backend/internal/platform/storage/repos"
	"dmd/backend/internal/platform/storage/repos/ability_repo"
	ws "dmd/backend/internal/services/websocket"
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
)

type AbilitiesHandler struct {
	handlers.BaseHandler
	repo      repos.AbilityRepository
	log       *slog.Logger
	wsManager *ws.Manager
}

func NewAbilitiesHandler(rs *common.RoutingServices, path string) common.IHandler {
	return &AbilitiesHandler{
		BaseHandler: handlers.NewBaseHandler(path),
		repo:        ability_repo.NewAbilityRepository(rs.DbConnection),
		log:         rs.Log,
		wsManager:   rs.WsManager,
	}
}

// GET /abilities?character_id=1
func (h *AbilitiesHandler) Get(w http.ResponseWriter, r *http.Request) {
	charIDStr := r.URL.Query().Get("character_id")
	if charIDStr == "" {
		utils.RespondWithError(w, errors.NewBadRequestError("Missing 'character_id' query parameter"))
		return
	}
	charID, _ := strconv.Atoi(charIDStr)

	abilities, err := h.repo.GetAbilitiesByCharacterID(uint(charID))
	if err != nil {
		utils.RespondWithError(w, err)
		return
	}
	utils.RespondWithJSON(w, http.StatusOK, abilities)
}

// POST /abilities
func (h *AbilitiesHandler) Post(w http.ResponseWriter, r *http.Request) {
	var newAbility character.Ability
	if err := json.NewDecoder(r.Body).Decode(&newAbility); err != nil {
		utils.RespondWithError(w, errors.NewBadRequestError("Invalid request body"))
		return
	}
	if newAbility.CharacterID == 0 {
		utils.RespondWithError(w, errors.NewBadRequestError("'CharacterID' is required"))
		return
	}
	if err := h.repo.CreateAbility(&newAbility); err != nil {
		utils.RespondWithError(w, err)
		return
	}
	utils.RespondWithJSON(w, http.StatusCreated, newAbility)
}
