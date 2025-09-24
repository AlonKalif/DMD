package items

import (
    "dmd/backend/internal/api/common"
    "dmd/backend/internal/model/gameplay"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "strconv"
    "strings"
    "testing"

    "github.com/gorilla/mux"
)

func TestItemCRUD(t *testing.T) {
    rs, _ := common.SetupTestEnvironment(t, &gameplay.Item{})
    handler := NewItemsHandler(rs, "/gameplay/items")
    var createdItem gameplay.Item

    t.Run("CREATE_Success", func(t *testing.T) {
        itemJSON := `{"name":"Healing Potion", "type":"Potion", "rarity":"Uncommon"}`
        req := httptest.NewRequest(http.MethodPost, handler.GetPath(), strings.NewReader(itemJSON))
        req.Header.Set("Content-Type", "application/json")
        rr := httptest.NewRecorder()
        handler.Post(rr, req)

        if status := rr.Code; status != http.StatusCreated {
            t.Fatalf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
        }
        json.NewDecoder(rr.Body).Decode(&createdItem)
        if createdItem.ID == 0 {
            t.Fatal("expected created item to have a non-zero ID")
        }
    })

    t.Run("GET_ByID_Success", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodGet, handler.GetPath()+"/"+strconv.Itoa(int(createdItem.ID)), nil)
        req = mux.SetURLVars(req, map[string]string{"id": strconv.Itoa(int(createdItem.ID))})
        rr := httptest.NewRecorder()
        handler.Get(rr, req)

        if status := rr.Code; status != http.StatusOK {
            t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
        }
    })

    // Add similar sub-tests for UPDATE and DELETE...
}

func TestItemFiltering(t *testing.T) {
    rs, db := common.SetupTestEnvironment(t, &gameplay.Item{})
    handler := NewItemsHandler(rs, "/gameplay/items")

    // Seed Data
    db.Create(&gameplay.Item{Name: "Longsword", Type: "Weapon", Rarity: "Common"})
    db.Create(&gameplay.Item{Name: "Plate Armor", Type: "Armor", Rarity: "Rare"})
    db.Create(&gameplay.Item{Name: "Shield", Type: "Armor", Rarity: "Common"})

    t.Run("Filter_By_Type", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodGet, handler.GetPath()+"?type=Armor", nil)
        rr := httptest.NewRecorder()
        handler.Get(rr, req)

        var results []*gameplay.Item
        json.NewDecoder(rr.Body).Decode(&results)

        if len(results) != 2 {
            t.Errorf("expected 2 armor items, got %d", len(results))
        }
    })
}
