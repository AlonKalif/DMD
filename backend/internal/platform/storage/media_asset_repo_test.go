package storage

import (
	"dmd/backend/internal/api/common/utils"
	"dmd/backend/internal/model/images"
	"testing"
)

func TestBulkCreateMediaAssets(t *testing.T) {
	rs, db := utils.SetupTestEnvironment(t, &images.ImageEntry{})
	repo := NewImagesRepository(rs.DbConnection)

	t.Run("Success_Case", func(t *testing.T) {
		assetsToCreate := []*images.ImageEntry{
			{Name: "Asset 1", Type: images.ImageTypeImage, FilePath: "path/1.jpg"},
			{Name: "Asset 2", Type: images.ImageTypeMap, FilePath: "path/2.jpg"},
		}
		err := repo.BulkCreateImageEntries(assetsToCreate)
		if err != nil {
			t.Fatalf("BulkCreate failed unexpectedly: %v", err)
		}

		var count int64
		db.Model(&images.ImageEntry{}).Count(&count)
		if count != 2 {
			t.Errorf("expected count to be 2, got %d", count)
		}
	})

	t.Run("Rollback_Case", func(t *testing.T) {
		db.Exec("DELETE FROM media_assets")

		// This will fail because 'FilePath' has a UNIQUE constraint.
		assetsToCreate := []*images.ImageEntry{
			{Name: "Valid Asset", Type: images.ImageTypeImage, FilePath: "path/valid.jpg"},
			{Name: "Duplicate Asset", Type: images.ImageTypeImage, FilePath: "path/valid.jpg"},
		}

		err := repo.BulkCreateImageEntries(assetsToCreate)
		if err == nil {
			t.Fatal("BulkCreate was expected to fail but did not")
		}

		var count int64
		db.Model(&images.ImageEntry{}).Count(&count)
		if count != 0 {
			t.Errorf("expected count to be 0 after rollback, got %d", count)
		}
	})
}
