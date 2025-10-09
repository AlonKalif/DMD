package storage

import (
	"dmd/backend/internal/model/gameplay"
	"dmd/backend/internal/platform/storage/common"
	"testing"
)

func TestBulkCreateItems(t *testing.T) {
	db := common.SetupTestDB(t, &gameplay.Item{})
	repo := NewItemRepository(db)

	t.Run("Success_Case", func(t *testing.T) {
		itemsToCreate := []*gameplay.Item{
			{Name: "Dagger"},
			{Name: "Shortbow"},
		}
		err := repo.BulkCreateItems(itemsToCreate)
		if err != nil {
			t.Fatalf("BulkCreate failed unexpectedly: %v", err)
		}

		var count int64
		db.Model(&gameplay.Item{}).Count(&count)
		if count != 2 {
			t.Errorf("expected count to be 2, got %d", count)
		}
	})

	t.Run("Rollback_Case", func(t *testing.T) {
		// Clean the table for this test
		db.Exec("DELETE FROM items")

		// This will fail because 'Name' has a UNIQUE constraint.
		itemsToCreate := []*gameplay.Item{
			{Name: "Greatsword"},
			{Name: "Greatsword"}, // Duplicate
		}

		err := repo.BulkCreateItems(itemsToCreate)
		if err == nil {
			t.Fatal("BulkCreate was expected to fail but did not")
		}

		var count int64
		db.Model(&gameplay.Item{}).Count(&count)
		if count != 0 {
			t.Errorf("expected count to be 0 after rollback, got %d", count)
		}
	})
}
