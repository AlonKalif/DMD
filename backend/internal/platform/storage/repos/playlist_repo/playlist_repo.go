// File: /internal/platform/storage/playlist_repo.go
package playlist_repo

import (
	"dmd/backend/internal/api/common/filters"
	"dmd/backend/internal/model/audio"
	"dmd/backend/internal/platform/storage/repos"

	"gorm.io/gorm"
)

type playlistRepo struct {
	db *gorm.DB
}

func NewPlaylistRepository(db *gorm.DB) repos.PlaylistRepository {
	return &playlistRepo{db: db}
}

func (r *playlistRepo) GetPlaylistByID(id uint) (*audio.Playlist, error) {
	var playlist audio.Playlist
	// Use Preload to automatically fetch the associated Tracks.
	if err := r.db.Preload("Tracks").First(&playlist, id).Error; err != nil {
		return nil, err
	}
	return &playlist, nil
}

func (r *playlistRepo) GetAllPlaylists(filters filters.PlaylistFilters) ([]*audio.Playlist, error) {
	var playlists []*audio.Playlist
	query := r.db.Model(&audio.Playlist{}).Preload("Tracks")

	if filters.Name != "" {
		query = query.Where("name LIKE ?", "%"+filters.Name+"%")
	}

	if filters.PageSize > 0 && filters.Page > 0 {
		offset := (filters.Page - 1) * filters.PageSize
		query = query.Limit(filters.PageSize).Offset(offset)
	}

	if err := query.Find(&playlists).Error; err != nil {
		return nil, err
	}
	return playlists, nil
}

func (r *playlistRepo) CreatePlaylist(playlist *audio.Playlist, trackIDs []uint) (*audio.Playlist, error) {
	err := r.db.Transaction(func(tx *gorm.DB) error {
		// 1. Create the playlist record first.
		if err := tx.Create(playlist).Error; err != nil {
			return err
		}

		// 2. If tracks are provided, manually create the join table records.
		if len(trackIDs) > 0 {
			for i, trackID := range trackIDs {
				joinRecord := audio.PlaylistTrack{
					PlaylistID: playlist.ID,
					TrackID:    trackID,
					TrackOrder: uint(i + 1), // Set the track order
				}
				if err := tx.Create(&joinRecord).Error; err != nil {
					return err // This will trigger a rollback
				}
			}
		}
		return nil // Commit
	})

	if err != nil {
		return nil, err
	}
	// Reload the playlist to include the newly associated tracks in the response.
	return r.GetPlaylistByID(playlist.ID)
}
