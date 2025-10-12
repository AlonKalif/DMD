// File: /internal/platform/storage/combat_repo.go
package combat_repo

import (
	"dmd/backend/internal/model/combat"
	"dmd/backend/internal/platform/storage/repos"

	"gorm.io/gorm"
)

type combatRepo struct {
	db *gorm.DB
}

func NewCombatRepository(db *gorm.DB) repos.CombatRepository {
	return &combatRepo{db: db}
}

// CreateCombat uses a transaction to create a Combat and its associated Combatants.
func (r *combatRepo) CreateCombat(combat *combat.Combat) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// GORM's association handling will automatically create the combatants
		// and set their CombatID when the parent Combat is created.
		if err := tx.Create(combat).Error; err != nil {
			return err // Rollback
		}
		return nil // Commit
	})
}

// GetActiveCombat finds the first combat marked as active.
// It uses Preload to automatically fetch the associated combatants.
func (r *combatRepo) GetActiveCombat() (*combat.Combat, error) {
	var activeCombat combat.Combat
	err := r.db.Preload("Combatants").Where("is_active = ?", true).First(&activeCombat).Error
	if err != nil {
		return nil, err
	}
	return &activeCombat, nil
}

func (r *combatRepo) GetCombatByID(id uint) (*combat.Combat, error) {
	var combat combat.Combat
	err := r.db.Preload("Combatants").First(&combat, id).Error
	if err != nil {
		return nil, err
	}
	return &combat, nil
}

func (r *combatRepo) UpdateCombatant(combatant *combat.Combatant) error {
	return r.db.Save(combatant).Error
}
