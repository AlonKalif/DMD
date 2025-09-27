package characters

import (
    "dmd/backend/internal/api/common"
    "dmd/backend/internal/api/handlers"
    "dmd/backend/internal/model/character"
    "dmd/backend/internal/platform/storage"
    ws "dmd/backend/internal/services/websocket"
    "encoding/json"
    "errors"
    "gorm.io/gorm"
    "log/slog"
    "net/http"
    "strconv"

    "github.com/gorilla/mux"
)

type CharactersHandler struct {
    handlers.BaseHandler
    repo      storage.CharacterRepository
    log       *slog.Logger
    wsManager *ws.Manager
}

func NewCharactersHandler(rs *common.RoutingServices, path string) common.IHandler {
    return &CharactersHandler{
        BaseHandler: handlers.NewBaseHandler(path),
        repo:        storage.NewCharacterRepository(rs.DbConnection),
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
        common.RespondWithError(w, common.NewBadRequestError("Invalid request body"))
        return
    }
    if err := h.repo.CreateCharacter(&newChar); err != nil {
        common.RespondWithError(w, err)
        return
    }
    common.RespondWithJSON(w, http.StatusCreated, newChar)
}

func (h *CharactersHandler) Put(w http.ResponseWriter, r *http.Request) {
    id, err := common.GetIDFromRequest(r)
    if err != nil {
        common.RespondWithError(w, err)
        return
    }

    var updatedChar character.Character
    if err := json.NewDecoder(r.Body).Decode(&updatedChar); err != nil {
        common.RespondWithError(w, common.NewBadRequestError("Invalid request body"))
        return
    }
    updatedChar.ID = id

    if err := h.repo.UpdateCharacter(&updatedChar); err != nil {
        common.RespondWithError(w, err)
        return
    }
    common.RespondWithJSON(w, http.StatusOK, updatedChar)
}

func (h *CharactersHandler) Delete(w http.ResponseWriter, r *http.Request) {
    id, err := common.GetIDFromRequest(r)
    if err != nil {
        common.RespondWithError(w, err)
        return
    }
    if err := h.repo.DeleteCharacter(id); err != nil {
        common.RespondWithError(w, err)
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
    filters := common.CharacterFilters{
        Name:     queryParams.Get("name"),
        Class:    queryParams.Get("class"),
        Page:     page,
        PageSize: pageSize,
    }

    // Pass the filters to the repository
    chars, err := h.repo.GetAllCharacters(filters)
    if err != nil {
        common.RespondWithError(w, err)
        return
    }
    common.RespondWithJSON(w, http.StatusOK, chars)
}

func (h *CharactersHandler) getCharacterByID(w http.ResponseWriter, r *http.Request) {
    id, err := common.GetIDFromRequest(r)
    if err != nil {
        common.RespondWithError(w, err)
        return
    }
    char, err := h.repo.GetCharacterByID(id)
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            common.RespondWithError(w, common.NewNotFoundError("Character not found"))
            return
        }
        common.RespondWithError(w, err)
        return
    }
    common.RespondWithJSON(w, http.StatusOK, char)
}
