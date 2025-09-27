// File: /internal/api/handlers/gameplay/npcs/npc_handlers.go
package npcs

import (
    "dmd/backend/internal/api/common"
    "dmd/backend/internal/api/handlers"
    "dmd/backend/internal/model/character"
    "dmd/backend/internal/platform/storage"
    "encoding/json"
    "errors"
    "gorm.io/gorm"
    "log/slog"
    "net/http"
    "strconv"

    "github.com/gorilla/mux"
)

type NPCsHandler struct {
    handlers.BaseHandler
    repo storage.NPCRepository
    log  *slog.Logger
}

func NewNPCsHandler(rs *common.RoutingServices, path string) common.IHandler {
    return &NPCsHandler{
        BaseHandler: handlers.NewBaseHandler(path),
        repo:        storage.NewNPCRepository(rs.DbConnection),
        log:         rs.Log,
    }
}

// --- Public Methods ---
func (h *NPCsHandler) Get(w http.ResponseWriter, r *http.Request) {
    if _, ok := mux.Vars(r)["id"]; ok {
        h.getNPCByID(w, r)
    } else {
        h.getAllNPCs(w, r)
    }
}

func (h *NPCsHandler) Post(w http.ResponseWriter, r *http.Request) {
    var newNpc character.NPC
    if err := json.NewDecoder(r.Body).Decode(&newNpc); err != nil {
        common.RespondWithError(w, common.NewBadRequestError("Invalid request body"))
        return
    }
    if err := h.repo.CreateNPC(&newNpc); err != nil {
        common.RespondWithError(w, err)
        return
    }
    common.RespondWithJSON(w, http.StatusCreated, newNpc)
}

func (h *NPCsHandler) Put(w http.ResponseWriter, r *http.Request) {
    // Implementation follows the same pattern as the Character PUT handler
    // ...
}

func (h *NPCsHandler) Delete(w http.ResponseWriter, r *http.Request) {
    // Implementation follows the same pattern as the Character DELETE handler
    // ...
}

// --- Private Helpers ---
func (h *NPCsHandler) getAllNPCs(w http.ResponseWriter, r *http.Request) {
    queryParams := r.URL.Query()
    page, _ := strconv.Atoi(queryParams.Get("page"))
    pageSize, _ := strconv.Atoi(queryParams.Get("pageSize"))

    filters := common.NPCFilters{
        Name:     queryParams.Get("name"),
        Type:     queryParams.Get("type"),
        Race:     queryParams.Get("race"),
        Page:     page,
        PageSize: pageSize,
    }

    npcs, err := h.repo.GetAllNPCs(filters)
    if err != nil {
        common.RespondWithError(w, err)
        return
    }
    common.RespondWithJSON(w, http.StatusOK, npcs)
}

func (h *NPCsHandler) getNPCByID(w http.ResponseWriter, r *http.Request) {
    id, err := common.GetIDFromRequest(r)
    if err != nil {
        common.RespondWithError(w, err)
        return
    }

    npc, err := h.repo.GetNPCByID(id)
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            common.RespondWithError(w, common.NewNotFoundError("NPC not found"))
            return
        }
        common.RespondWithError(w, err)
        return
    }
    common.RespondWithJSON(w, http.StatusOK, npc)
}
