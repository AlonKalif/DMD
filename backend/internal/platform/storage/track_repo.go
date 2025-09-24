package storage

import (
    "dmd/backend/internal/model/audio"
    "gorm.io/gorm"
)

type trackRepo struct {
    db *gorm.DB
}

func NewTrackRepository(db *gorm.DB) TrackRepository {
    return &trackRepo{db: db}
}

func (r *trackRepo) GetTrackByID(id uint) (*audio.Track, error) {
    var track audio.Track
    if err := r.db.First(&track, id).Error; err != nil {
        return nil, err
    }
    return &track, nil
}
