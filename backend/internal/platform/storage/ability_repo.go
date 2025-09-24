package storage

import (
    "dmd/backend/internal/model/character"
    "gorm.io/gorm"
)

type abilityRepo struct {
    db *gorm.DB
}

func NewAbilityRepository(db *gorm.DB) AbilityRepository {
    return &abilityRepo{db: db}
}

func (r *abilityRepo) GetAbilityByID(id uint) (*character.Ability, error) {
    var ability character.Ability
    if err := r.db.First(&ability, id).Error; err != nil {
        return nil, err
    }
    return &ability, nil
}
