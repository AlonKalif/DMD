// File: /internal/services/assets/asset_service.go
package assets

import (
    "dmd/backend/internal/model/media"
    "dmd/backend/internal/platform/storage"
    "errors"
    "gorm.io/gorm"
    "log/slog"
    "os"
    "path/filepath"
    "strings"
)

type AssetService struct {
    repo storage.MediaAssetRepository
    log  *slog.Logger
}

func NewService(repo storage.MediaAssetRepository, log *slog.Logger) *AssetService {
    return &AssetService{repo: repo, log: log}
}

// SyncAssetsWithDatabase scans the public/images directory and creates DB records for new files.
func (s *AssetService) SyncAssetsWithDatabase() {
    const imagesDir = "public/images"
    s.log.Info("Starting asset sync with database...", "directory", imagesDir)

    files, err := os.ReadDir(imagesDir)
    if err != nil {
        s.log.Error("Failed to read assets directory", "error", err)
        return
    }

    for _, file := range files {
        if file.IsDir() {
            continue // Skip subdirectories for now
        }

        // img.png -> images/img.png
        filePath := filepath.Join(imagesDir, file.Name())

        // Check if asset already exists in the DB
        _, err := s.repo.GetMediaAssetByPath(filePath)
        if err == nil {
            continue // Asset already exists, skip.
        }

        if errors.Is(err, gorm.ErrRecordNotFound) {
            // Asset does not exist, so create it.
            asset := &media.MediaAsset{
                Name:     strings.TrimSuffix(file.Name(), filepath.Ext(file.Name())),
                Type:     media.AssetTypeImage, // Assuming all are images for now
                FilePath: filePath,
            }
            if err := s.repo.CreateMediaAsset(asset); err != nil {
                s.log.Error("Failed to create media asset record", "file", file.Name(), "error", err)
            } else {
                s.log.Info("New asset discovered and added to database", "file", file.Name())
            }
        } else {
            // Handle other database errors
            s.log.Error("Database error while checking for existing asset", "file", file.Name(), "error", err)
        }
    }
    s.log.Info("Asset sync finished.")
}
