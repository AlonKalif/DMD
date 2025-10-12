// File: /internal/platform/storage/track_repo.go
package track_repo

import (
	"dmd/backend/internal/api/common/filters"
	"dmd/backend/internal/model/audio"
	"dmd/backend/internal/platform/storage/repos"

	"gorm.io/gorm"
)

type trackRepo struct {
	db *gorm.DB
}

func NewTrackRepository(db *gorm.DB) repos.TrackRepository {
	return &trackRepo{db: db}
}

func (r *trackRepo) GetTrackByID(id uint) (*audio.Track, error) {
	var track audio.Track
	if err := r.db.First(&track, id).Error; err != nil {
		return nil, err
	}
	return &track, nil
}

func (r *trackRepo) GetAllTracks(filters filters.TrackFilters) ([]*audio.Track, error) {
	var tracks []*audio.Track
	query := r.db.Model(&audio.Track{})

	if filters.Title != "" {
		query = query.Where("title LIKE ?", "%"+filters.Title+"%")
	}
	if filters.Artist != "" {
		query = query.Where("artist LIKE ?", "%"+filters.Artist+"%")
	}
	if filters.Source != "" {
		query = query.Where("source = ?", filters.Source)
	}

	if filters.PageSize > 0 && filters.Page > 0 {
		offset := (filters.Page - 1) * filters.PageSize
		query = query.Limit(filters.PageSize).Offset(offset)
	}

	if err := query.Find(&tracks).Error; err != nil {
		return nil, err
	}
	return tracks, nil
}

func (r *trackRepo) CreateTrack(track *audio.Track) error {
	return r.db.Create(track).Error
}

func (r *trackRepo) UpdateTrack(track *audio.Track) error {
	return r.db.Save(track).Error
}

func (r *trackRepo) DeleteTrack(id uint) error {
	return r.db.Delete(&audio.Track{}, id).Error
}

func (r *trackRepo) BulkCreateTracks(tracks []*audio.Track) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, track := range tracks {
			if err := tx.Create(track).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
