// File: /internal/services/images/image_service.go
package images

import (
	"dmd/backend/internal/api/common/filters"
	"dmd/backend/internal/model/images"
	"dmd/backend/internal/model/websocket"
	"dmd/backend/internal/platform/storage"
	"dmd/backend/internal/services/watcher"
	wsService "dmd/backend/internal/services/websocket"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	"github.com/fsnotify/fsnotify"
)

type Service struct {
	log        *slog.Logger
	repo       storage.ImagesRepository
	wsManager  *wsService.Manager
	dirWatcher *watcher.Service
	imagesPath string
}

func NewService(log *slog.Logger, repo storage.ImagesRepository, wsManager *wsService.Manager, imagesPath string) *Service {
	newImgSvc := &Service{}
	newImgSvc.log = log
	newImgSvc.repo = repo
	newImgSvc.wsManager = wsManager
	newImgSvc.dirWatcher = watcher.NewService(log, imagesPath, newImgSvc.imagesDirEventHandler)
	newImgSvc.imagesPath = imagesPath

	newImgSvc.SyncImageEntriesWithDatabase()

	return newImgSvc
}

func (s *Service) RunImagesDirWatcher() {
	s.dirWatcher.Run()
}

// SyncImageEntriesWithDatabase performs a two-way sync between the filesystem and the database.
func (s *Service) SyncImageEntriesWithDatabase() {

	diskImages, err := s.getDiskImages(s.imagesPath)
	if err != nil {
		s.log.Error("Failed to read images directory", "error", err)
		return
	}

	dbImages, err := s.getDatabaseImages()
	if err != nil {
		s.log.Error("Failed to fetch images images from DB", "error", err)
		return
	}

	s.removeOrphanedImages(diskImages, dbImages)

	s.addNewImages(diskImages, dbImages)
}

func (s *Service) imagesDirEventHandler(event fsnotify.Event) error {
	if event.Has(fsnotify.Create) || event.Has(fsnotify.Remove) || event.Has(fsnotify.Rename) {

		s.SyncImageEntriesWithDatabase()
		s.wsManager.Broadcast(websocket.Event{Type: "images_updated"})
	}

	return nil
}

// Helpers

// getDiskImages scans the filesystem and returns a map of file paths.
func (s *Service) getDiskImages(dir string) (map[string]bool, error) {
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

// getDatabaseImages fetches all image records and returns a map of file paths to IDs.
func (s *Service) getDatabaseImages() (map[string]uint, error) {
	dbImages, err := s.repo.GetAllImages(filters.ImagesFilters{})
	if err != nil {
		return nil, err
	}
	dbFilePaths := make(map[string]uint)
	for _, img := range dbImages {
		dbFilePaths[img.FilePath] = img.ID
	}
	return dbFilePaths, nil
}

// removeOrphanedImages deletes DB records for files that no longer exist on disk.
func (s *Service) removeOrphanedImages(diskFiles map[string]bool, dbImages map[string]uint) {
	for path, id := range dbImages {
		if _, foundOnDisk := diskFiles[path]; !foundOnDisk {
			if err := s.repo.DeleteImage(id); err != nil {
				s.log.Error("Failed to delete orphan image record", "path", path, "error", err)
			} else {
				s.log.Info("Removed orphan image record from database", "path", path)
			}
		}
	}
}

// addNewImages creates DB records for new files found on disk.
func (s *Service) addNewImages(diskFiles map[string]bool, dbImages map[string]uint) {
	for path := range diskFiles {
		if _, foundInDb := dbImages[path]; !foundInDb {
			fileName := filepath.Base(path)
			img := &images.ImageEntry{
				Name:     strings.TrimSuffix(fileName, filepath.Ext(fileName)),
				Type:     images.ImageTypeUnknown,
				FilePath: path,
			}
			if err := s.repo.CreateImageEntry(img); err != nil {
				s.log.Error("Failed to create image record", "file", fileName, "error", err)
			} else {
				s.log.Info("New image found and added to database", "file", fileName)
			}
		}
	}
}
