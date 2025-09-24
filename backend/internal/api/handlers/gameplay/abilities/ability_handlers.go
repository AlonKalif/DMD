// File: /internal/api/handlers/gameplay/abilities/ability_handlers.go
package abilities

import (
    "dmd/backend/internal/api/common"
    "dmd/backend/internal/api/handlers"
    "dmd/backend/internal/model/character"
    "dmd/backend/internal/platform/storage"
    ws "dmd/backend/internal/services/websocket"
    "encoding/json"
    "log/slog"
    "net/http"
    "strconv"
)

type AbilitiesHandler struct {
    handlers.BaseHandler
    repo      storage.AbilityRepository
    log       *slog.Logger
    wsManager *ws.Manager
}

func NewAbilitiesHandler(rs *common.RoutingServices, path string) common.IHandler {
    return &AbilitiesHandler{
        BaseHandler: handlers.NewBaseHandler(path),
        repo:        storage.NewAbilityRepository(rs.DbConnection),
        log:         rs.Log,
        wsManager:   rs.WsManager,
    }
}

// GET /abilities?character_id=1
func (h *AbilitiesHandler) Get(w http.ResponseWriter, r *http.Request) {
    charIDStr := r.URL.Query().Get("character_id")
    if charIDStr == "" {
        common.HandleAPIError(w, h.log, common.NewBadRequestError("Missing 'character_id' query parameter"))
        return
    }
    charID, _ := strconv.Atoi(charIDStr)

    abilities, err := h.repo.GetAbilitiesByCharacterID(uint(charID))
    if err != nil {
        common.HandleAPIError(w, h.log, err)
        return
    }
    common.RespondWithJSON(w, http.StatusOK, abilities)
}

// POST /abilities
func (h *AbilitiesHandler) Post(w http.ResponseWriter, r *http.Request) {
    var newAbility character.Ability
    if err := json.NewDecoder(r.Body).Decode(&newAbility); err != nil {
        common.HandleAPIError(w, h.log, common.NewBadRequestError("Invalid request body"))
        return
    }
    if newAbility.CharacterID == 0 {
        common.HandleAPIError(w, h.log, common.NewBadRequestError("'CharacterID' is required"))
        return
    }
    if err := h.repo.CreateAbility(&newAbility); err != nil {
        common.HandleAPIError(w, h.log, err)
        return
    }
    common.RespondWithJSON(w, http.StatusCreated, newAbility)
}
