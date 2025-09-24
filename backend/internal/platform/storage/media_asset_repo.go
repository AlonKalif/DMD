package storage

import (
    "dmd/backend/internal/model/media"
    "gorm.io/gorm"
)

type mediaAssetRepo struct {
    db *gorm.DB
}

func NewMediaAssetRepository(db *gorm.DB) MediaAssetRepository {
    return &mediaAssetRepo{db: db}
}

func (r *mediaAssetRepo) GetMediaAssetByID(id uint) (*media.MediaAsset, error) {
    var asset media.MediaAsset
    if err := r.db.First(&asset, id).Error; err != nil {
        return nil, err
    }
    return &asset, nil
}
