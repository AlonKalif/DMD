package abilities

import (
    "dmd/backend/internal/api/common"
    "dmd/backend/internal/model/character"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "strconv"
    "strings"
    "testing"
)

//func setupTestHandler(t *testing.T) (common.IHandler, *gorm.DB) {
//    log := slog.New(slog.NewTextHandler(io.Discard, nil))
//    db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
//    if err != nil {
//        t.Fatalf("failed to connect to in-memory database: %v", err)
//    }
//
//    // Migrate both Character and Ability schemas, as they are related.
//    if err := db.AutoMigrate(&character.Character{}, &character.Ability{}); err != nil {
//        t.Fatalf("failed to migrate database: %v", err)
//    }
//
//    routingServices := &common.RoutingServices{
//        Log:          log,
//        DbConnection: db,
//        WsManager:    nil,
//    }
//    handler := NewAbilitiesHandler(routingServices, "/gameplay/abilities")
//    return handler, db
//}

func TestAbilityHandlers(t *testing.T) {
    rs, db := common.SetupTestEnvironment(t, &character.Ability{}, &character.Character{})
    handler := NewAbilitiesHandler(rs, "/gameplay/abilities")

    // Seed a character to own the abilities.
    seedChar := character.Character{Name: "Test Character"}
    db.Create(&seedChar)

    var createdAbility character.Ability

    t.Run("POST_Success", func(t *testing.T) {
        abilityJSON := `{"character_id":` + strconv.Itoa(int(seedChar.ID)) + `, "name":"Second Wind", "description":"Heal yourself"}`
        req := httptest.NewRequest(http.MethodPost, handler.GetPath(), strings.NewReader(abilityJSON))
        rr := httptest.NewRecorder()

        handler.Post(rr, req)

        if status := rr.Code; status != http.StatusCreated {
            t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
        }
        json.NewDecoder(rr.Body).Decode(&createdAbility)
        if createdAbility.ID == 0 {
            t.Error("expected created ability to have a non-zero ID")
        }
    })

    t.Run("GET_ByCharacterID_Success", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodGet, handler.GetPath()+"?character_id="+strconv.Itoa(int(seedChar.ID)), nil)
        rr := httptest.NewRecorder()

        handler.Get(rr, req)

        if status := rr.Code; status != http.StatusOK {
            t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
        }

        var results []character.Ability
        json.NewDecoder(rr.Body).Decode(&results)
        if len(results) != 1 || results[0].Name != "Second Wind" {
            t.Errorf("expected to get 1 ability, but got %d", len(results))
        }
    })

    t.Run("GET_Fail_MissingQueryParam", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodGet, handler.GetPath(), nil)
        rr := httptest.NewRecorder()
        handler.Get(rr, req)
        if status := rr.Code; status != http.StatusBadRequest {
            t.Errorf("expected 400 Bad Request for missing param, got %d", rr.Code)
        }
    })
}
