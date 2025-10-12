package npc_repo

import (
	"dmd/backend/internal/model/character"
	"dmd/backend/internal/platform/storage/repos/common"
	"testing"
)

func TestBulkCreateNPCs(t *testing.T) {
	db := common.SetupTestDB(t, &character.NPC{})
	repo := NewNPCRepository(db)

	t.Run("Success_Case", func(t *testing.T) {
		npcsToCreate := []*character.NPC{
			{Name: "Kobold A"},
			{Name: "Kobold B"},
		}
		err := repo.BulkCreateNPCs(npcsToCreate)
		if err != nil {
			t.Fatalf("BulkCreate failed unexpectedly: %v", err)
		}

		var count int64
		db.Model(&character.NPC{}).Count(&count)
		if count != 2 {
			t.Errorf("expected count to be 2, got %d", count)
		}
	})

	t.Run("Rollback_Case", func(t *testing.T) {
		// Clean the table for the new test
		db.Exec("DELETE FROM npcs")

		// This slice will now cause a database-level unique constraint violation.
		npcsToCreate := []*character.NPC{
			{Name: "Bugbear A"},
			{Name: "Bugbear A"},
		}

		// The db.Migrator().CreateIndex(...) line is no longer needed and can be deleted.

		err := repo.BulkCreateNPCs(npcsToCreate)
		if err == nil {
			t.Fatal("BulkCreate was expected to fail but did not")
		}

		var count int64
		db.Model(&character.NPC{}).Count(&count)
		if count != 0 {
			t.Errorf("expected count to be 0 after rollback, got %d", count)
		}
	})
}
