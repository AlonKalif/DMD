package spell_repo

import (
	"dmd/backend/internal/api/common/filters"
	"dmd/backend/internal/model/gameplay"
	"dmd/backend/internal/platform/storage/repos"

	"gorm.io/gorm"
)

type spellRepo struct {
	db *gorm.DB
}

func NewSpellRepository(db *gorm.DB) repos.SpellRepository {
	return &spellRepo{db: db}
}

func (r *spellRepo) GetSpellByID(id uint) (*gameplay.Spell, error) {
	var spell gameplay.Spell
	if err := r.db.First(&spell, id).Error; err != nil {
		return nil, err
	}
	return &spell, nil
}

func (r *spellRepo) GetAllSpells(filters filters.SpellFilters) ([]*gameplay.Spell, error) {
	var spells []*gameplay.Spell
	query := r.db.Model(&gameplay.Spell{})

	if filters.Name != "" {
		query = query.Where("name LIKE ?", "%"+filters.Name+"%")
	}
	if filters.School != "" {
		query = query.Where("school = ?", filters.School)
	}
	if filters.Level != nil {
		query = query.Where("level = ?", *filters.Level)
	}
	if filters.IsConcentration != nil {
		query = query.Where("is_concentration = ?", *filters.IsConcentration)
	}

	if filters.PageSize > 0 && filters.Page > 0 {
		offset := (filters.Page - 1) * filters.PageSize
		query = query.Limit(filters.PageSize).Offset(offset)
	}

	if err := query.Find(&spells).Error; err != nil {
		return nil, err
	}
	return spells, nil
}

func (r *spellRepo) CreateSpell(spell *gameplay.Spell) error {
	return r.db.Create(spell).Error
}

func (r *spellRepo) UpdateSpell(spell *gameplay.Spell) error {
	return r.db.Save(spell).Error
}

func (r *spellRepo) DeleteSpell(id uint) error {
	return r.db.Delete(&gameplay.Spell{}, id).Error
}

func (r *spellRepo) BulkCreateSpells(spells []*gameplay.Spell) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, spell := range spells {
			if err := tx.Create(spell).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
