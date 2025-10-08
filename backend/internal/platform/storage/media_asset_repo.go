package storage

import (
	"dmd/backend/internal/api/common/filters"
	"dmd/backend/internal/model/media"

	"gorm.io/gorm"
)

type mediaAssetRepo struct {
	db *gorm.DB
}

func NewMediaAssetRepository(db *gorm.DB) MediaAssetRepository {
	return &mediaAssetRepo{db: db}
}

func (r *mediaAssetRepo) GetMediaAssetByPath(path string) (*media.MediaAsset, error) {
	var asset media.MediaAsset
	if err := r.db.Where("file_path = ?", path).First(&asset).Error; err != nil {
		return nil, err
	}
	return &asset, nil
}

func (r *mediaAssetRepo) GetMediaAssetByID(id uint) (*media.MediaAsset, error) {
	var asset media.MediaAsset
	if err := r.db.First(&asset, id).Error; err != nil {
		return nil, err
	}
	return &asset, nil
}

func (r *mediaAssetRepo) GetAllMediaAssets(filters filters.MediaAssetFilters) ([]*media.MediaAsset, error) {
	var assets []*media.MediaAsset
	query := r.db.Model(&media.MediaAsset{})

	if filters.Name != "" {
		query = query.Where("name LIKE ?", "%"+filters.Name+"%")
	}
	if filters.Type != "" {
		query = query.Where("type = ?", filters.Type)
	}

	if filters.PageSize > 0 && filters.Page > 0 {
		offset := (filters.Page - 1) * filters.PageSize
		query = query.Limit(filters.PageSize).Offset(offset)
	}

	if err := query.Find(&assets).Error; err != nil {
		return nil, err
	}

	return assets, nil
}

func (r *mediaAssetRepo) CreateMediaAsset(asset *media.MediaAsset) error {
	return r.db.Create(asset).Error
}

func (r *mediaAssetRepo) UpdateMediaAsset(asset *media.MediaAsset) error {
	return r.db.Save(asset).Error
}

func (r *mediaAssetRepo) DeleteMediaAsset(id uint) error {
	return r.db.Delete(&media.MediaAsset{}, id).Error
}

func (r *mediaAssetRepo) BulkCreateMediaAssets(assets []*media.MediaAsset) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, asset := range assets {
			if err := tx.Create(asset).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
