package storage

import (
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
