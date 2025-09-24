package storage

import (
    "dmd/backend/internal/model/combat"
    "gorm.io/gorm"
)

type combatRepo struct {
    db *gorm.DB
}

func NewCombatRepository(db *gorm.DB) CombatRepository {
    return &combatRepo{db: db}
}

func (r *combatRepo) GetCombatByID(id uint) (*combat.Combat, error) {
    var combat combat.Combat
    if err := r.db.First(&combat, id).Error; err != nil {
        return nil, err
    }
    return &combat, nil
}
