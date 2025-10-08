// File: /internal/services/assets/asset_service.go
package assets

import (
	"dmd/backend/internal/api/common/filters"
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

	diskAssets, err := s.getDiskAssets(imagesDir)
	if err != nil {
		s.log.Error("Failed to read assets directory", "error", err)
		return
	}

	dbAssets, err := s.getDatabaseAssets()
	if err != nil {
		s.log.Error("Failed to fetch media assets from DB", "error", err)
		return
	}

	s.removeOrphanedAssets(diskAssets, dbAssets)

	s.addNewAssets(diskAssets, dbAssets)
}

// getDiskAssets scans the filesystem and returns a map of file paths.
func (s *Service) getDiskAssets(dir string) (map[string]bool, error) {
	diskFiles := make(map[string]bool)
	files, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}
	for _, file := range files {
		if !file.IsDir() {
			// Construct the path relative to the 'public' directory, e.g., "images/my-image.png"
			diskFiles[filepath.Join(filepath.Base(dir), file.Name())] = true
		}
	}
	return diskFiles, nil
}

// getDatabaseAssets fetches all asset records and returns a map of file paths to IDs.
func (s *Service) getDatabaseAssets() (map[string]uint, error) {
	dbAssets, err := s.repo.GetAllMediaAssets(filters.MediaAssetFilters{})
	if err != nil {
		return nil, err
	}
	dbFilePaths := make(map[string]uint)
	for _, asset := range dbAssets {
		dbFilePaths[asset.FilePath] = asset.ID
	}
	return dbFilePaths, nil
}

// removeOrphanedAssets deletes DB records for files that no longer exist on disk.
func (s *Service) removeOrphanedAssets(diskFiles map[string]bool, dbAssets map[string]uint) {
	for path, id := range dbAssets {
		if _, foundOnDisk := diskFiles[path]; !foundOnDisk {
			if err := s.repo.DeleteMediaAsset(id); err != nil {
				s.log.Error("Failed to delete orphan asset record", "path", path, "error", err)
			} else {
				s.log.Info("Removed orphan asset record from database", "path", path)
			}
		}
	}
}

// addNewAssets creates DB records for new files found on disk.
func (s *Service) addNewAssets(diskFiles map[string]bool, dbAssets map[string]uint) {
	for path := range diskFiles {
		if _, foundInDb := dbAssets[path]; !foundInDb {
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
}
