package combat_repo

import (
	"dmd/backend/internal/model/combat"
	"dmd/backend/internal/platform/storage/repos/common"
	"testing"
)

func TestCreateCombat_Success(t *testing.T) {
	// Setup a clean DB specifically for this test.
	db := common.SetupTestDB(t, &combat.Combat{}, &combat.Combatant{})
	repo := NewCombatRepository(db)

	combatToCreate := &combat.Combat{
		IsActive: true,
		Combatants: []combat.Combatant{
			{Name: "Hero", Initiative: 20, CombatantID: 1, CombatantType: "characters"},
			{Name: "Villain", Initiative: 10, CombatantID: 1, CombatantType: "npcs"},
		},
	}

	err := repo.CreateCombat(combatToCreate)
	if err != nil {
		t.Fatalf("CreateCombat failed unexpectedly: %v", err)
	}

	var combatCount, combatantCount int64
	db.Model(&combat.Combat{}).Count(&combatCount)
	db.Model(&combat.Combatant{}).Count(&combatantCount)

	if combatCount != 1 || combatantCount != 2 {
		t.Errorf("expected 1 combat and 2 combatants, got %d and %d", combatCount, combatantCount)
	}
}

func TestCreateCombat_Rollback(t *testing.T) {
	// Setup a separate, clean DB for this test.
	db := common.SetupTestDB(t, &combat.Combat{}, &combat.Combatant{})
	repo := NewCombatRepository(db)

	// This combat is invalid because it contains duplicate participants.
	duplicateCombatant := combat.Combatant{
		Name: "Duplicate Hero", Initiative: 15, CombatantID: 1, CombatantType: "characters",
	}
	invalidCombat := &combat.Combat{
		IsActive: true,
		Combatants: []combat.Combatant{
			duplicateCombatant,
			duplicateCombatant,
		},
	}

	err := repo.CreateCombat(invalidCombat)
	if err == nil {
		t.Fatal("CreateCombat was expected to fail but did not")
	}

	var combatCount, combatantCount int64
	db.Model(&combat.Combat{}).Count(&combatCount)
	db.Model(&combat.Combatant{}).Count(&combatantCount)

	// Since this test started with an empty DB, the count after rollback should be 0.
	if combatCount != 0 || combatantCount != 0 {
		t.Errorf("expected counts to be 0 after rollback, got %d and %d", combatCount, combatantCount)
	}
}
