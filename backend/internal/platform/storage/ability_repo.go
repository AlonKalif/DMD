// File: /internal/platform/storage/ability_repo.go
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

func (r *abilityRepo) GetAbilitiesByCharacterID(characterID uint) ([]*character.Ability, error) {
    var abilities []*character.Ability
    if err := r.db.Where("character_id = ?", characterID).Find(&abilities).Error; err != nil {
        return nil, err
    }
    return abilities, nil
}

func (r *abilityRepo) CreateAbility(ability *character.Ability) error {
    return r.db.Create(ability).Error
}

func (r *abilityRepo) UpdateAbility(ability *character.Ability) error {
    return r.db.Save(ability).Error
}

func (r *abilityRepo) DeleteAbility(id uint) error {
    return r.db.Delete(&character.Ability{}, id).Error
}

func (r *abilityRepo) AssignAbilitiesToCharacter(characterID uint, abilities []*character.Ability) error {
    return r.db.Transaction(func(tx *gorm.DB) error {
        for _, ability := range abilities {
            ability.CharacterID = characterID
            if err := tx.Create(ability).Error; err != nil {
                return err // Rollback
            }
        }
        return nil // Commit
    })
}
