package combat

import (
	"dmd/backend/internal/api/common/utils"
	"dmd/backend/internal/model/combat"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCreateCombatHandler(t *testing.T) {
	// 1. Setup a clean test environment.
	rs, _ := utils.SetupTestEnvironment(t, &combat.Combat{}, &combat.Combatant{})
	handler := NewCombatHandler(rs, "/gameplay/combat")

	// 2. Define the test case.
	combatJSON := `{
		"is_active": true,
		"name": "Forest Ambush",
		"combatants": [
			{"name": "Player 1", "initiative": 20, "combatant_id": 1, "combatant_type": "characters"},
			{"name": "Goblin A", "initiative": 15, "combatant_id": 1, "combatant_type": "npcs"}
		]
	}`
	req := httptest.NewRequest(http.MethodPost, handler.GetPath(), strings.NewReader(combatJSON))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	// 3. Act by calling the handler.
	handler.Post(rr, req)

	// 4. Assert the results.
	if status := rr.Code; status != http.StatusCreated {
		t.Fatalf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	var createdCombat combat.Combat
	if err := json.NewDecoder(rr.Body).Decode(&createdCombat); err != nil {
		t.Fatalf("could not decode response body: %v", err)
	}
	if createdCombat.ID == 0 {
		t.Error("expected created combat to have a non-zero ID")
	}
	if len(createdCombat.Combatants) != 2 {
		t.Errorf("expected created combat to have 2 combatants, got %d", len(createdCombat.Combatants))
	}
}

func TestGetActiveCombatHandler(t *testing.T) {
	// 1. Setup a clean test environment.
	rs, db := utils.SetupTestEnvironment(t, &combat.Combat{}, &combat.Combatant{})
	handler := NewCombatHandler(rs, "/gameplay/combat")

	// 2. Seed the database with the specific data needed for this test.
	seedCombat := &combat.Combat{
		IsActive: true,
		Name:     "Cave Encounter",
		Combatants: []combat.Combatant{
			{Name: "Hero", Initiative: 18},
		},
	}
	db.Create(seedCombat)

	// 3. Define the test case.
	req := httptest.NewRequest(http.MethodGet, handler.GetPath(), nil)
	rr := httptest.NewRecorder()

	// 4. Act by calling the handler.
	handler.Get(rr, req)

	// 5. Assert the results.
	if status := rr.Code; status != http.StatusOK {
		t.Fatalf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var fetchedCombat combat.Combat
	json.NewDecoder(rr.Body).Decode(&fetchedCombat)

	if fetchedCombat.Name != "Cave Encounter" {
		t.Errorf("fetched wrong combat: got name %q want %q", fetchedCombat.Name, "Cave Encounter")
	}
}
