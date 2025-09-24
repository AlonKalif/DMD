package npcs

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

//func setupTestHandler(t *testing.T) (common.IHandler, *gorm.DB) {
//    log := slog.New(slog.NewTextHandler(io.Discard, nil))
//    db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
//    if err != nil {
//        t.Fatalf("failed to connect to in-memory database: %v", err)
//    }
//
//    if err := db.AutoMigrate(&character.NPC{}); err != nil {
//        t.Fatalf("failed to migrate database: %v", err)
//    }
//
//    routingServices := &common.RoutingServices{
//        Log:          log,
//        DbConnection: db,
//        WsManager:    nil,
//    }
//    handler := NewNPCsHandler(routingServices, "/gameplay/npcs")
//    return handler, db // Return the db instance.
//}

func TestNPCCrud(t *testing.T) {
    rs, _ := common.SetupTestEnvironment(t, &character.NPC{})
    handler := NewNPCsHandler(rs, "/gameplay/npcs")
    var createdNPC character.NPC

    t.Run("CREATE_Success", func(t *testing.T) {
        npcJSON := `{"Name":"Goblin", "Type":"Humanoid", "Race":"Goblinoid"}`
        req := httptest.NewRequest(http.MethodPost, handler.GetPath(), strings.NewReader(npcJSON))
        rr := httptest.NewRecorder()

        handler.Post(rr, req)

        if status := rr.Code; status != http.StatusCreated {
            t.Fatalf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
        }
        json.NewDecoder(rr.Body).Decode(&createdNPC)
        if createdNPC.ID == 0 {
            t.Fatal("expected created NPC to have a non-zero ID")
        }
    })

    t.Run("GET_ByID_Success", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodGet, handler.GetPath()+"/"+strconv.Itoa(int(createdNPC.ID)), nil)
        rr := httptest.NewRecorder()
        req = mux.SetURLVars(req, map[string]string{"id": strconv.Itoa(int(createdNPC.ID))})

        handler.Get(rr, req)

        if status := rr.Code; status != http.StatusOK {
            t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
        }
    })

    // Add similar sub-tests for UPDATE and DELETE...
}

func TestNPCFiltering(t *testing.T) {
    rs, db := common.SetupTestEnvironment(t, &character.NPC{})
    handler := NewNPCsHandler(rs, "/gameplay/npcs")

    // Seed Data directly using the returned db handle.
    db.Create(&character.NPC{Name: "Goblin Grunt", Type: "Humanoid", Race: "Goblinoid"})
    db.Create(&character.NPC{Name: "Orc War Chief", Type: "Humanoid", Race: "Orc"})
    db.Create(&character.NPC{Name: "Goblin Shaman", Type: "Humanoid", Race: "Goblinoid"})

    t.Run("Filter_By_Race", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodGet, handler.GetPath()+"?race=Goblinoid", nil)
        rr := httptest.NewRecorder()

        handler.Get(rr, req)

        var results []*character.NPC
        json.NewDecoder(rr.Body).Decode(&results)

        if len(results) != 2 {
            t.Errorf("expected 2 goblins, got %d", len(results))
        }
    })

    t.Run("Pagination", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodGet, handler.GetPath()+"?pageSize=1&page=2", nil)
        rr := httptest.NewRecorder()

        handler.Get(rr, req)

        var results []*character.NPC
        json.NewDecoder(rr.Body).Decode(&results)

        if len(results) != 1 {
            t.Fatalf("expected 1 result for pagination, got %d", len(results))
        }
        if results[0].Name != "Orc War Chief" {
            t.Errorf("expected page 2 to be the Orc, got %s", results[0].Name)
        }
    })
}
