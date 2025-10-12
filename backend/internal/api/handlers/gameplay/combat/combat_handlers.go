// File: /internal/api/handlers/gameplay/combat/combat_handlers.go
package combat

import (
	"dmd/backend/internal/api/common"
	errors2 "dmd/backend/internal/api/common/errors"
	"dmd/backend/internal/api/common/utils"
	"dmd/backend/internal/api/handlers"
	"dmd/backend/internal/model/combat"
	"dmd/backend/internal/platform/storage/repos"
	"dmd/backend/internal/platform/storage/repos/combat_repo"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"gorm.io/gorm"
)

type CombatHandler struct {
	handlers.BaseHandler
	repo repos.CombatRepository
	log  *slog.Logger
}

func NewCombatHandler(rs *common.RoutingServices, path string) common.IHandler {
	return &CombatHandler{
		BaseHandler: handlers.NewBaseHandler(path),
		repo:        combat_repo.NewCombatRepository(rs.DbConnection),
		log:         rs.Log,
	}
}

// GET /combat - retrieves the currently active combat encounter.
func (h *CombatHandler) Get(w http.ResponseWriter, r *http.Request) {
	activeCombat, err := h.repo.GetActiveCombat()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			utils.RespondWithError(w, errors2.NewNotFoundError("No active combat found"))
			return
		}
		utils.RespondWithError(w, err)
		return
	}
	utils.RespondWithJSON(w, http.StatusOK, activeCombat)
}

// POST /combat - starts a new combat encounter.
func (h *CombatHandler) Post(w http.ResponseWriter, r *http.Request) {
	var newCombat combat.Combat
	if err := json.NewDecoder(r.Body).Decode(&newCombat); err != nil {
		utils.RespondWithError(w, errors2.NewBadRequestError("Invalid request body"))
		return
	}

	if err := h.repo.CreateCombat(&newCombat); err != nil {
		utils.RespondWithError(w, err)
		return
	}
	utils.RespondWithJSON(w, http.StatusCreated, newCombat)
}
