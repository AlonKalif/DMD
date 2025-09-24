package spells

import (
    "dmd/backend/internal/api/common"
    "dmd/backend/internal/model/gameplay"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "strings"
    "testing"
)

func TestSpellCRUD(t *testing.T) {
    rs, _ := common.SetupTestEnvironment(t, &gameplay.Spell{})
    handler := NewSpellsHandler(rs, "/gameplay/spells")

    // Test CREATE
    var createdSpell gameplay.Spell
    t.Run("POST_Create", func(t *testing.T) {
        spellJSON := `{"name":"Magic Missile", "level":1, "school":"Evocation", "casting_time":"1 Action", "range":"120 feet", "duration":"Instantaneous"}`
        req := httptest.NewRequest(http.MethodPost, handler.GetPath(), strings.NewReader(spellJSON))
        req.Header.Set("Content-Type", "application/json")
        rr := httptest.NewRecorder()
        handler.Post(rr, req)

        if status := rr.Code; status != http.StatusCreated {
            t.Fatalf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
        }
        json.NewDecoder(rr.Body).Decode(&createdSpell)
        if createdSpell.ID == 0 {
            t.Fatal("expected created spell to have a non-zero ID")
        }
    })

    // Test GET BY ID
    t.Run("GET_ByID", func(t *testing.T) {
        // ... Implementation similar to previous GetByID tests ...
    })

    // Test UPDATE
    t.Run("PUT_Update", func(t *testing.T) {
        // ... Implementation similar to previous Update tests ...
    })

    // Test DELETE
    t.Run("DELETE", func(t *testing.T) {
        // ... Implementation similar to previous Delete tests ...
    })
}

func TestSpellFiltering(t *testing.T) {
    rs, db := common.SetupTestEnvironment(t, &gameplay.Spell{})
    handler := NewSpellsHandler(rs, "/gameplay/spells")

    // Seed Data
    db.Create(&gameplay.Spell{Name: "Fireball", School: "Evocation", Level: 3})
    db.Create(&gameplay.Spell{Name: "Shield", School: "Abjuration", Level: 1})
    db.Create(&gameplay.Spell{Name: "Invisibility", School: "Illusion", Level: 2, IsConcentration: true})

    t.Run("Filter_By_Level", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodGet, handler.GetPath()+"?level=1", nil)
        rr := httptest.NewRecorder()
        handler.Get(rr, req)

        if status := rr.Code; status != http.StatusOK {
            t.Fatalf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
        }
        var results []*gameplay.Spell
        json.NewDecoder(rr.Body).Decode(&results)
        if len(results) != 1 || results[0].Name != "Shield" {
            t.Errorf("expected 1 spell of level 1, got %d", len(results))
        }
    })

    t.Run("Filter_By_Concentration", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodGet, handler.GetPath()+"?concentration=true", nil)
        rr := httptest.NewRecorder()
        handler.Get(rr, req)

        var results []*gameplay.Spell
        json.NewDecoder(rr.Body).Decode(&results)
        if len(results) != 1 || results[0].Name != "Invisibility" {
            t.Errorf("expected 1 concentration spell, got %d", len(results))
        }
    })
}
