package storage

import (
    "dmd/backend/internal/model/gameplay"
    "gorm.io/gorm"
)

type spellRepo struct {
    db *gorm.DB
}

func NewSpellRepository(db *gorm.DB) SpellRepository {
    return &spellRepo{db: db}
}

func (r *spellRepo) GetSpellByID(id uint) (*gameplay.Spell, error) {
    var spell gameplay.Spell
    if err := r.db.First(&spell, id).Error; err != nil {
        return nil, err
    }
    return &spell, nil
}
