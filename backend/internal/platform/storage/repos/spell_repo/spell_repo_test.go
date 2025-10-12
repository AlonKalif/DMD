package spell_repo

import (
	"dmd/backend/internal/model/gameplay"
	"dmd/backend/internal/platform/storage/repos/common"
	"testing"
)

func TestBulkCreateSpells(t *testing.T) {
	db := common.SetupTestDB(t, &gameplay.Spell{})
	repo := NewSpellRepository(db)

	t.Run("Success_Case", func(t *testing.T) {
		spellsToCreate := []*gameplay.Spell{
			{Name: "Fireball", School: "Evocation", CastingTime: "1 Action", Range: "150 feet", Duration: "Instantaneous"},
			{Name: "Mage Armor", School: "Abjuration", CastingTime: "1 Action", Range: "Touch", Duration: "8 Hours"},
		}
		err := repo.BulkCreateSpells(spellsToCreate)
		if err != nil {
			t.Fatalf("BulkCreate failed unexpectedly: %v", err)
		}

		var count int64
		db.Model(&gameplay.Spell{}).Count(&count)
		if count != 2 {
			t.Errorf("expected count to be 2, got %d", count)
		}
	})

	t.Run("Rollback_Case", func(t *testing.T) {
		db.Exec("DELETE FROM spells")

		// This will fail because 'Name' has a UNIQUE constraint.
		spellsToCreate := []*gameplay.Spell{
			{Name: "Shield", School: "Abjuration", CastingTime: "1 Reaction", Range: "Self", Duration: "1 Round"},
			{Name: "Shield"}, // Duplicate name
		}

		err := repo.BulkCreateSpells(spellsToCreate)
		if err == nil {
			t.Fatal("BulkCreate was expected to fail but did not")
		}

		var count int64
		db.Model(&gameplay.Spell{}).Count(&count)
		if count != 0 {
			t.Errorf("expected count to be 0 after rollback, got %d", count)
		}
	})
}
