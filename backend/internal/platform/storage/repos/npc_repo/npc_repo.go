// File: /internal/platform/storage/npc_repo.go
package npc_repo

import (
	"dmd/backend/internal/api/common/filters"
	"dmd/backend/internal/model/character"
	"dmd/backend/internal/platform/storage/repos"

	"gorm.io/gorm"
)

type npcRepo struct {
	db *gorm.DB
}

func NewNPCRepository(db *gorm.DB) repos.NPCRepository {
	return &npcRepo{db: db}
}

func (r *npcRepo) GetNPCByID(id uint) (*character.NPC, error) {
	var npc character.NPC
	if err := r.db.First(&npc, id).Error; err != nil {
		return nil, err
	}
	return &npc, nil
}

func (r *npcRepo) GetAllNPCs(filters filters.NPCFilters) ([]*character.NPC, error) {
	var npcs []*character.NPC
	query := r.db.Model(&character.NPC{})

	if filters.Name != "" {
		query = query.Where("name LIKE ?", "%"+filters.Name+"%")
	}
	if filters.Type != "" {
		query = query.Where("type = ?", filters.Type)
	}
	if filters.Race != "" {
		query = query.Where("race = ?", filters.Race)
	}

	if filters.PageSize > 0 && filters.Page > 0 {
		offset := (filters.Page - 1) * filters.PageSize
		query = query.Limit(filters.PageSize).Offset(offset)
	}

	if err := query.Find(&npcs).Error; err != nil {
		return nil, err
	}
	return npcs, nil
}

func (r *npcRepo) CreateNPC(npc *character.NPC) error {
	return r.db.Create(npc).Error
}

func (r *npcRepo) UpdateNPC(npc *character.NPC) error {
	return r.db.Save(npc).Error
}

func (r *npcRepo) DeleteNPC(id uint) error {
	return r.db.Delete(&character.NPC{}, id).Error
}

// BulkCreateNPCs uses a transaction to create multiple NPCs at once.
func (r *npcRepo) BulkCreateNPCs(npcs []*character.NPC) error {
	// If any of the create operations fail, the entire transaction is rolled back.
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, npc := range npcs {
			if err := tx.Create(npc).Error; err != nil {
				return err // Returning an error triggers a rollback
			}
		}
		return nil // Returning nil commits the transaction
	})
}
