// File: /internal/api/handlers/gameplay/combat/combat_handlers.go
package combat

import (
    "dmd/backend/internal/api/common"
    "dmd/backend/internal/api/handlers"
    "dmd/backend/internal/model/combat"
    "dmd/backend/internal/platform/storage"
    "encoding/json"
    "errors"
    "gorm.io/gorm"
    "log/slog"
    "net/http"
)

type CombatHandler struct {
    handlers.BaseHandler
    repo storage.CombatRepository
    log  *slog.Logger
}

func NewCombatHandler(rs *common.RoutingServices, path string) common.IHandler {
    return &CombatHandler{
        BaseHandler: handlers.NewBaseHandler(path),
        repo:        storage.NewCombatRepository(rs.DbConnection),
        log:         rs.Log,
    }
}

// GET /combat - retrieves the currently active combat encounter.
func (h *CombatHandler) Get(w http.ResponseWriter, r *http.Request) {
    activeCombat, err := h.repo.GetActiveCombat()
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            common.RespondWithError(w, common.NewNotFoundError("No active combat found"))
            return
        }
        common.RespondWithError(w, err)
        return
    }
    common.RespondWithJSON(w, http.StatusOK, activeCombat)
}

// POST /combat - starts a new combat encounter.
func (h *CombatHandler) Post(w http.ResponseWriter, r *http.Request) {
    var newCombat combat.Combat
    if err := json.NewDecoder(r.Body).Decode(&newCombat); err != nil {
        common.RespondWithError(w, common.NewBadRequestError("Invalid request body"))
        return
    }

    if err := h.repo.CreateCombat(&newCombat); err != nil {
        common.RespondWithError(w, err)
        return
    }
    common.RespondWithJSON(w, http.StatusCreated, newCombat)
}
