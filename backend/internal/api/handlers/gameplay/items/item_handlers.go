// File: /internal/api/handlers/gameplay/items/item_handlers.go
package items

import (
	"dmd/backend/internal/api/common"
	errors2 "dmd/backend/internal/api/common/errors"
	"dmd/backend/internal/api/common/filters"
	"dmd/backend/internal/api/common/utils"
	"dmd/backend/internal/api/handlers"
	"dmd/backend/internal/model/gameplay"
	"dmd/backend/internal/platform/storage"
	ws "dmd/backend/internal/services/websocket"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"gorm.io/gorm"

	"github.com/gorilla/mux"
)

type ItemsHandler struct {
	handlers.BaseHandler
	repo      storage.ItemRepository
	log       *slog.Logger
	wsManager *ws.Manager
}

func NewItemsHandler(rs *common.RoutingServices, path string) common.IHandler {
	return &ItemsHandler{
		BaseHandler: handlers.NewBaseHandler(path),
		repo:        storage.NewItemRepository(rs.DbConnection),
		log:         rs.Log,
		wsManager:   rs.WsManager,
	}
}

func (h *ItemsHandler) Get(w http.ResponseWriter, r *http.Request) {
	if _, ok := mux.Vars(r)["id"]; ok {
		h.getItemByID(w, r)
	} else {
		h.getAllItems(w, r)
	}
}

func (h *ItemsHandler) Post(w http.ResponseWriter, r *http.Request) {
	var newItem gameplay.Item
	if err := json.NewDecoder(r.Body).Decode(&newItem); err != nil {
		utils.RespondWithError(w, errors2.NewBadRequestError("Invalid request body"))
		return
	}
	if err := h.repo.CreateItem(&newItem); err != nil {
		utils.RespondWithError(w, err)
		return
	}
	utils.RespondWithJSON(w, http.StatusCreated, newItem)
}

// ... (Implement PUT and DELETE following the modular pattern)

// --- Private Helpers ---
func (h *ItemsHandler) getAllItems(w http.ResponseWriter, r *http.Request) {
	queryParams := r.URL.Query()
	page, _ := strconv.Atoi(queryParams.Get("page"))
	pageSize, _ := strconv.Atoi(queryParams.Get("pageSize"))

	filters := filters.ItemFilters{
		Name:     queryParams.Get("name"),
		Type:     queryParams.Get("type"),
		Rarity:   queryParams.Get("rarity"),
		Page:     page,
		PageSize: pageSize,
	}

	items, err := h.repo.GetAllItems(filters)
	if err != nil {
		utils.RespondWithError(w, err)
		return
	}
	utils.RespondWithJSON(w, http.StatusOK, items)
}

func (h *ItemsHandler) getItemByID(w http.ResponseWriter, r *http.Request) {
	id, err := utils.GetIDFromRequest(r) // Assumes GetIDFromRequest is in common
	if err != nil {
		utils.RespondWithError(w, err)
		return
	}
	item, err := h.repo.GetItemByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			utils.RespondWithError(w, errors2.NewNotFoundError("Item not found"))
			return
		}
		utils.RespondWithError(w, err)
		return
	}
	utils.RespondWithJSON(w, http.StatusOK, item)
}
