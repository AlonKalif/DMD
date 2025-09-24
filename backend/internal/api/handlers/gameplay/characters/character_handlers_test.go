package characters

import (
    "dmd/backend/internal/api/common"
    "dmd/backend/internal/model/character"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "strconv"
    "strings"
    "testing"

    "github.com/gorilla/mux"
)

// setupTestHandler now also handles database migration.
//func setupTestHandler(t *testing.T) common.IHandler {
//    log := slog.New(slog.NewTextHandler(io.Discard, nil))
//    db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
//    if err != nil {
//        t.Fatalf("failed to connect to in-memory database: %v", err)
//    }
//
//    // CRITICAL: Auto-migrate the schema to create the 'characters' table.
//    if err := db.AutoMigrate(&character.Character{}); err != nil {
//        t.Fatalf("failed to migrate database: %v", err)
//    }
//
//    routingServices := &common.RoutingServices{
//        Log:          log,
//        DbConnection: db,
//        WsManager:    nil,
//    }
//    return NewCharactersHandler(routingServices, "/gameplay/characters")
//}

func TestCharacterCRUD(t *testing.T) {
    rs, _ := common.SetupTestEnvironment(t, &character.Character{})
    handler := NewCharactersHandler(rs, "/gameplay/characters")
    var createdChar character.Character // To store the character between sub-tests

    // --- 1. Test CREATE ---
    t.Run("CREATE_Success", func(t *testing.T) {
        charJSON := `{"Name":"Aragorn", "Class":"Ranger", "Level":10}`
        req := httptest.NewRequest(http.MethodPost, handler.GetPath(), strings.NewReader(charJSON))
        rr := httptest.NewRecorder()

        handler.Post(rr, req)

        if status := rr.Code; status != http.StatusCreated {
            t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
        }

        if err := json.NewDecoder(rr.Body).Decode(&createdChar); err != nil {
            t.Fatalf("could not decode response body: %v", err)
        }

        if createdChar.Name != "Aragorn" {
            t.Errorf("handler returned unexpected name: got %v want %v", createdChar.Name, "Aragorn")
        }
        if createdChar.ID == 0 {
            t.Errorf("expected created character to have a non-zero ID")
        }
    })

    // --- 2. Test GET BY ID ---
    t.Run("GET_ByID_Success", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodGet, handler.GetPath()+"/"+strconv.Itoa(int(createdChar.ID)), nil)
        rr := httptest.NewRecorder()
        req = mux.SetURLVars(req, map[string]string{"id": strconv.Itoa(int(createdChar.ID))})

        handler.Get(rr, req)

        if status := rr.Code; status != http.StatusOK {
            t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
        }

        var fetchedChar character.Character
        json.NewDecoder(rr.Body).Decode(&fetchedChar)
        if fetchedChar.Name != createdChar.Name {
            t.Errorf("fetched character name mismatch: got %v want %v", fetchedChar.Name, createdChar.Name)
        }
    })

    // --- 3. Test UPDATE ---
    t.Run("UPDATE_Success", func(t *testing.T) {
        createdChar.Level = 11 // Update the level
        updatedJSON, _ := json.Marshal(createdChar)
        req := httptest.NewRequest(http.MethodPut, handler.GetPath()+"/"+strconv.Itoa(int(createdChar.ID)), strings.NewReader(string(updatedJSON)))
        rr := httptest.NewRecorder()
        req = mux.SetURLVars(req, map[string]string{"id": strconv.Itoa(int(createdChar.ID))})

        handler.Put(rr, req)

        if status := rr.Code; status != http.StatusOK {
            t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
        }

        var updatedCharResp character.Character
        json.NewDecoder(rr.Body).Decode(&updatedCharResp)
        if updatedCharResp.Level != 11 {
            t.Errorf("character level was not updated: got %v want %v", updatedCharResp.Level, 11)
        }
    })

    // --- 4. Test DELETE ---
    t.Run("DELETE_Success", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodDelete, handler.GetPath()+"/"+strconv.Itoa(int(createdChar.ID)), nil)
        rr := httptest.NewRecorder()
        req = mux.SetURLVars(req, map[string]string{"id": strconv.Itoa(int(createdChar.ID))})

        handler.Delete(rr, req)

        if status := rr.Code; status != http.StatusNoContent {
            t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNoContent)
        }
    })

    // --- 5. Confirm DELETION ---
    t.Run("GET_After_Delete_NotFound", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodGet, handler.GetPath()+"/"+strconv.Itoa(int(createdChar.ID)), nil)
        rr := httptest.NewRecorder()
        req = mux.SetURLVars(req, map[string]string{"id": strconv.Itoa(int(createdChar.ID))})

        handler.Get(rr, req)

        if status := rr.Code; status != http.StatusNotFound {
            t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)
        }
    })
}
