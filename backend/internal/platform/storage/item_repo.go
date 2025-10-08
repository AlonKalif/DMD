// File: /internal/platform/storage/item_repo.go
package storage

import (
	"dmd/backend/internal/api/common/filters"
	"dmd/backend/internal/model/gameplay"

	"gorm.io/gorm"
)

type itemRepo struct {
	db *gorm.DB
}

func NewItemRepository(db *gorm.DB) ItemRepository {
	return &itemRepo{db: db}
}

func (r *itemRepo) GetItemByID(id uint) (*gameplay.Item, error) {
	var item gameplay.Item
	if err := r.db.First(&item, id).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *itemRepo) GetAllItems(filters filters.ItemFilters) ([]*gameplay.Item, error) {
	var items []*gameplay.Item
	query := r.db.Model(&gameplay.Item{})

	if filters.Name != "" {
		query = query.Where("name LIKE ?", "%"+filters.Name+"%")
	}
	if filters.Type != "" {
		query = query.Where("type = ?", filters.Type)
	}
	if filters.Rarity != "" {
		query = query.Where("rarity = ?", filters.Rarity)
	}

	if filters.PageSize > 0 && filters.Page > 0 {
		offset := (filters.Page - 1) * filters.PageSize
		query = query.Limit(filters.PageSize).Offset(offset)
	}

	if err := query.Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (r *itemRepo) CreateItem(item *gameplay.Item) error {
	return r.db.Create(item).Error
}

func (r *itemRepo) UpdateItem(item *gameplay.Item) error {
	return r.db.Save(item).Error
}

func (r *itemRepo) DeleteItem(id uint) error {
	return r.db.Delete(&gameplay.Item{}, id).Error
}

func (r *itemRepo) BulkCreateItems(items []*gameplay.Item) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, item := range items {
			if err := tx.Create(item).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
