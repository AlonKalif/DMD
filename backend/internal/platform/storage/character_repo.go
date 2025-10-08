// File: /internal/platform/storage/character_repo.go
package storage

import (
	"dmd/backend/internal/api/common/filters"
	"dmd/backend/internal/model/character"

	"gorm.io/gorm"
)

// characterRepo is the concrete implementation of the CharacterRepository interface.
// Note: We rename the struct to be unexported (lowercase 'c').
type characterRepo struct {
	db *gorm.DB
}

// NewCharacterRepository now returns the interface type.
// This hides the concrete implementation from the rest of the application.
func NewCharacterRepository(db *gorm.DB) CharacterRepository {
	return &characterRepo{db: db}
}

// GetCharacterByID retrieves a single character by their ID.
func (r *characterRepo) GetCharacterByID(id uint) (*character.Character, error) {
	var char character.Character
	if err := r.db.First(&char, id).Error; err != nil {
		return nil, err
	}
	return &char, nil
}

func (r *characterRepo) GetAllCharacters(filters filters.CharacterFilters) ([]*character.Character, error) {
	var chars []*character.Character

	// Start with a base query
	query := r.db.Model(&character.Character{})

	// Conditionally add 'WHERE' clauses based on the filters
	if filters.Name != "" {
		query = query.Where("name LIKE ?", "%"+filters.Name+"%")
	}
	if filters.Class != "" {
		query = query.Where("class = ?", filters.Class)
	}

	// Add pagination
	if filters.PageSize > 0 && filters.Page > 0 {
		offset := (filters.Page - 1) * filters.PageSize
		query = query.Limit(filters.PageSize).Offset(offset)
	}

	// Execute the final, constructed query
	if err := query.Find(&chars).Error; err != nil {
		return nil, err
	}
	return chars, nil
}

func (r *characterRepo) CreateCharacter(char *character.Character) error {
	return r.db.Create(char).Error
}

func (r *characterRepo) UpdateCharacter(char *character.Character) error {
	// GORM's Save function updates all fields if the primary key is included.
	return r.db.Save(char).Error
}

func (r *characterRepo) DeleteCharacter(id uint) error {
	return r.db.Delete(&character.Character{}, id).Error
}

func (r *characterRepo) LevelUpCharacter(id uint, newMaxHP uint) (*character.Character, error) {
	var char character.Character

	// Start a new transaction.
	err := r.db.Transaction(func(tx *gorm.DB) error {
		// 1. Find the character within the transaction.
		if err := tx.First(&char, id).Error; err != nil {
			return err // Return error to rollback.
		}

		// 2. Perform the first update (Level).
		if err := tx.Model(&char).Update("level", char.Level+1).Error; err != nil {
			return err // Return error to rollback.
		}

		// 3. Perform the second update (HP).
		if err := tx.Model(&char).Update("max_hp", newMaxHP).Error; err != nil {
			return err // Return error to rollback.
		}

		// 4. Return nil to commit the transaction.
		return nil
	})

	if err != nil {
		return nil, err
	}

	return &char, nil
}
