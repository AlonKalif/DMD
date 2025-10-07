// File: /internal/services/assets/asset_service.go
package assets

import (
	"dmd/backend/internal/api/common"
	"dmd/backend/internal/model/media"
	"dmd/backend/internal/platform/storage"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
)

type Service struct {
	repo storage.MediaAssetRepository
	log  *slog.Logger
}

func NewService(repo storage.MediaAssetRepository, log *slog.Logger) *Service {
	return &Service{repo: repo, log: log}
}

// SyncAssetsWithDatabase performs a two-way sync between the filesystem and the database.
func (s *Service) SyncAssetsWithDatabase() {
	const imagesDir = "public/images"

	// --- Pass 1: Get all file paths from the disk ---
	diskFiles := make(map[string]bool)
	files, err := os.ReadDir(imagesDir)
	if err != nil {
		s.log.Error("Failed to read assets directory", "error", err)
		return
	}
	for _, file := range files {
		if !file.IsDir() {
			diskFiles[filepath.Join("images", file.Name())] = true
		}
	}

	// --- Pass 2: Get all asset records from the database ---
	dbAssets, err := s.repo.GetAllMediaAssets(common.MediaAssetFilters{})
	if err != nil {
		s.log.Error("Failed to fetch media assets from DB", "error", err)
		return
	}

	// --- Pass 3: Find and remove orphan records from the DB ---
	dbFilePaths := make(map[string]uint)
	for _, asset := range dbAssets {
		dbFilePaths[asset.FilePath] = asset.ID
		if _, foundOnDisk := diskFiles[asset.FilePath]; !foundOnDisk {
			if err := s.repo.DeleteMediaAsset(asset.ID); err != nil {
				s.log.Error("Failed to delete orphan asset record", "path", asset.FilePath, "error", err)
			} else {
				s.log.Info("Removed orphan asset record from database", "path", asset.FilePath)
			}
		}
	}

	// --- Pass 4: Find and add new files to the DB ---
	for path := range diskFiles {
		if _, foundInDb := dbFilePaths[path]; !foundInDb {
			fileName := filepath.Base(path)
			asset := &media.MediaAsset{
				Name:     strings.TrimSuffix(fileName, filepath.Ext(fileName)),
				Type:     media.AssetTypeImage,
				FilePath: path,
			}
			if err := s.repo.CreateMediaAsset(asset); err != nil {
				s.log.Error("Failed to create media asset record", "file", fileName, "error", err)
			} else {
				s.log.Info("New asset discovered and added to database", "file", fileName)
			}
		}
	}

	s.log.Info("Asset sync finished.")
}
