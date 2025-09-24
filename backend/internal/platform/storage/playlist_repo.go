package storage

import (
    "dmd/backend/internal/model/audio"
    "gorm.io/gorm"
)

type playlistRepo struct {
    db *gorm.DB
}

func NewPlaylistRepository(db *gorm.DB) PlaylistRepository {
    return &playlistRepo{db: db}
}

func (r *playlistRepo) GetPlaylistByID(id uint) (*audio.Playlist, error) {
    var playlist audio.Playlist
    if err := r.db.First(&playlist, id).Error; err != nil {
        return nil, err
    }
    return &playlist, nil
}
