package images_repo

import (
	"dmd/backend/internal/api/common/filters"
	"dmd/backend/internal/model/images"
	"dmd/backend/internal/platform/storage/repos"

	"gorm.io/gorm"
)

type imagesRepo struct {
	db *gorm.DB
}

func NewImagesRepository(db *gorm.DB) repos.ImagesRepository {
	return &imagesRepo{db: db}
}

func (r *imagesRepo) GetImageByPath(path string) (*images.ImageEntry, error) {
	var asset images.ImageEntry
	if err := r.db.Where("file_path = ?", path).First(&asset).Error; err != nil {
		return nil, err
	}
	return &asset, nil
}

func (r *imagesRepo) GetImageByID(id uint) (*images.ImageEntry, error) {
	var asset images.ImageEntry
	if err := r.db.First(&asset, id).Error; err != nil {
		return nil, err
	}
	return &asset, nil
}

func (r *imagesRepo) GetAllImages(filters filters.ImagesFilters) ([]*images.ImageEntry, error) {
	var assets []*images.ImageEntry
	query := r.db.Model(&images.ImageEntry{})

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

// GetAllTypes queries the database for a distinct list of non-empty image types.
func (r *imagesRepo) GetAllTypes() ([]string, error) {
	var types []string

	result := r.db.Model(&images.ImageEntry{}).
		Distinct("type").
		Where("type IS NOT NULL AND type != ? AND type != ?", "", images.ImageTypeUnknown).
		Order("type asc").
		Pluck("type", &types)

	if result.Error != nil {
		return nil, result.Error
	}

	return types, nil
}

func (r *imagesRepo) CreateImageEntry(asset *images.ImageEntry) error {
	return r.db.Create(asset).Error
}

func (r *imagesRepo) UpdateImageEntry(asset *images.ImageEntry) error {
	return r.db.Save(asset).Error
}

func (r *imagesRepo) DeleteImage(id uint) error {
	return r.db.Delete(&images.ImageEntry{}, id).Error
}

func (r *imagesRepo) BulkCreateImageEntries(assets []*images.ImageEntry) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, asset := range assets {
			if err := tx.Create(asset).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *imagesRepo) CreatePreset(preset *images.PresetLayout) error {
	if err := r.db.Create(preset).Error; err != nil {
		return err
	}
	return nil
}

func (r *imagesRepo) GetAllPresets() ([]*images.PresetLayout, error) {
	var presets []*images.PresetLayout
	err := r.db.Preload("Slots.Image").Order("created_at desc").Find(&presets).Error
	if err != nil {
		return nil, err
	}

	return presets, nil
}
