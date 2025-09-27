package storage

import (
    "dmd/backend/internal/api/common"
    "dmd/backend/internal/model/media"
    "testing"
)

func TestBulkCreateMediaAssets(t *testing.T) {
    rs, db := common.SetupTestEnvironment(t, &media.MediaAsset{})
    repo := NewMediaAssetRepository(rs.DbConnection)

    t.Run("Success_Case", func(t *testing.T) {
        assetsToCreate := []*media.MediaAsset{
            {Name: "Asset 1", Type: media.AssetTypeImage, FilePath: "path/1.jpg"},
            {Name: "Asset 2", Type: media.AssetTypeMap, FilePath: "path/2.jpg"},
        }
        err := repo.BulkCreateMediaAssets(assetsToCreate)
        if err != nil {
            t.Fatalf("BulkCreate failed unexpectedly: %v", err)
        }

        var count int64
        db.Model(&media.MediaAsset{}).Count(&count)
        if count != 2 {
            t.Errorf("expected count to be 2, got %d", count)
        }
    })

    t.Run("Rollback_Case", func(t *testing.T) {
        db.Exec("DELETE FROM media_assets")

        // This will fail because 'FilePath' has a UNIQUE constraint.
        assetsToCreate := []*media.MediaAsset{
            {Name: "Valid Asset", Type: media.AssetTypeImage, FilePath: "path/valid.jpg"},
            {Name: "Duplicate Asset", Type: media.AssetTypeImage, FilePath: "path/valid.jpg"},
        }

        err := repo.BulkCreateMediaAssets(assetsToCreate)
        if err == nil {
            t.Fatal("BulkCreate was expected to fail but did not")
        }

        var count int64
        db.Model(&media.MediaAsset{}).Count(&count)
        if count != 0 {
            t.Errorf("expected count to be 0 after rollback, got %d", count)
        }
    })
}
