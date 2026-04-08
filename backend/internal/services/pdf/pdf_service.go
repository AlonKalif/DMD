package pdf

import (
	"dmd/backend/internal/api/common/filters"
	"dmd/backend/internal/model/images"
	"dmd/backend/internal/model/websocket"
	"dmd/backend/internal/platform/storage/repos"
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
	repo       repos.ImagesRepository
	wsManager  *wsService.Manager
	dirWatcher *watcher.Service
	pdfPath    string
}

func NewService(log *slog.Logger, repo repos.ImagesRepository, wsManager *wsService.Manager, pdfPath string) *Service {
	svc := &Service{
		log:       log,
		repo:      repo,
		wsManager: wsManager,
		pdfPath:   pdfPath,
	}
	svc.dirWatcher = watcher.NewService(log, pdfPath, svc.pdfDirEventHandler)

	svc.SyncPdfEntriesWithDatabase()

	return svc
}

func (s *Service) RunPdfDirWatcher() {
	s.dirWatcher.Run()
}

func (s *Service) GetPdfPath() string {
	return s.pdfPath
}

// DeletePdfFile removes the physical PDF file from disk.
// The filesystem watcher will detect the removal and automatically
// sync the database (soft-delete the record) and broadcast the update.
func (s *Service) DeletePdfFile(id uint) error {
	entry, err := s.repo.GetImageByID(id)
	if err != nil {
		return err
	}

	parentDir := filepath.Dir(s.pdfPath)
	fullPath := filepath.Join(parentDir, entry.FilePath)

	if err := os.Remove(fullPath); err != nil {
		return err
	}

	s.log.Info("PDF file deleted from disk", "path", fullPath)
	return nil
}

// SyncPdfEntriesWithDatabase performs a two-way sync between the pdf directory and the database.
func (s *Service) SyncPdfEntriesWithDatabase() {
	diskPdfs, err := s.getDiskPdfs(s.pdfPath)
	if err != nil {
		s.log.Error("Failed to read pdf directory", "error", err)
		return
	}

	dbPdfs, err := s.getDatabasePdfs()
	if err != nil {
		s.log.Error("Failed to fetch pdf entries from DB", "error", err)
		return
	}

	s.removeOrphanedPdfs(diskPdfs, dbPdfs)
	s.addNewPdfs(diskPdfs, dbPdfs)
}

func (s *Service) pdfDirEventHandler(event fsnotify.Event) error {
	if event.Has(fsnotify.Create) || event.Has(fsnotify.Remove) || event.Has(fsnotify.Rename) {
		s.SyncPdfEntriesWithDatabase()
		s.wsManager.Broadcast(websocket.Event{Type: "images_updated"})
	}
	return nil
}

func (s *Service) getDiskPdfs(dir string) (map[string]bool, error) {
	diskFiles := make(map[string]bool)
	files, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}
	for _, file := range files {
		if !file.IsDir() {
			diskFiles[filepath.Join(filepath.Base(dir), file.Name())] = true
		}
	}
	return diskFiles, nil
}

// getDatabasePdfs fetches all entries whose FilePath starts with "pdf/" prefix.
func (s *Service) getDatabasePdfs() (map[string]uint, error) {
	allEntries, err := s.repo.GetAllImages(filters.ImagesFilters{})
	if err != nil {
		return nil, err
	}
	dbFilePaths := make(map[string]uint)
	for _, entry := range allEntries {
		if strings.HasPrefix(entry.FilePath, "pdf/") {
			dbFilePaths[entry.FilePath] = entry.ID
		}
	}
	return dbFilePaths, nil
}

func (s *Service) removeOrphanedPdfs(diskFiles map[string]bool, dbPdfs map[string]uint) {
	for path, id := range dbPdfs {
		if _, foundOnDisk := diskFiles[path]; !foundOnDisk {
			if err := s.repo.DeleteImage(id); err != nil {
				s.log.Error("Failed to delete orphan pdf record", "path", path, "error", err)
			} else {
				s.log.Info("Removed orphan pdf record from database", "path", path)
			}
		}
	}
}

func (s *Service) addNewPdfs(diskFiles map[string]bool, dbPdfs map[string]uint) {
	for path := range diskFiles {
		if _, foundInDb := dbPdfs[path]; !foundInDb {
			fileName := filepath.Base(path)
			if restored, err := s.repo.RestoreSoftDeletedByPath(path); err == nil && restored {
				s.log.Info("Restored previously deleted pdf record", "file", fileName)
				continue
			}
			entry := &images.ImageEntry{
				Name:     strings.TrimSuffix(fileName, filepath.Ext(fileName)),
				Type:     images.ImageTypePDF,
				FilePath: path,
			}
			if err := s.repo.CreateImageEntry(entry); err != nil {
				s.log.Error("Failed to create pdf record", "file", fileName, "error", err)
			} else {
				s.log.Info("New PDF found and added to database", "file", fileName)
			}
		}
	}
}
