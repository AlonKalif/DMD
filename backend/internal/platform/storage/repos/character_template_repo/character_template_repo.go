package character_template_repo

import (
	"dmd/backend/internal/api/common/filters"
	"dmd/backend/internal/model/crawl"
	"dmd/backend/internal/platform/storage/repos"

	"gorm.io/gorm"
)

type characterTemplateRepo struct {
	db *gorm.DB
}

func NewCharacterTemplateRepository(db *gorm.DB) repos.CharacterTemplateRepository {
	return &characterTemplateRepo{db: db}
}

func (r *characterTemplateRepo) GetByID(id uint) (*crawl.CharacterTemplate, error) {
	var tmpl crawl.CharacterTemplate
	if err := r.db.First(&tmpl, id).Error; err != nil {
		return nil, err
	}
	return &tmpl, nil
}

func (r *characterTemplateRepo) GetAll(f filters.CharacterTemplateFilters) ([]*crawl.CharacterTemplate, error) {
	var templates []*crawl.CharacterTemplate

	query := r.db.Model(&crawl.CharacterTemplate{})

	if f.Name != "" {
		query = query.Where("name LIKE ?", "%"+f.Name+"%")
	}

	if f.CharacterType != "" {
		query = query.Where("character_type = ?", f.CharacterType)
	}

	if f.PageSize > 0 && f.Page > 0 {
		offset := (f.Page - 1) * f.PageSize
		query = query.Limit(f.PageSize).Offset(offset)
	}

	if err := query.Find(&templates).Error; err != nil {
		return nil, err
	}
	return templates, nil
}

func (r *characterTemplateRepo) Create(tmpl *crawl.CharacterTemplate) error {
	return r.db.Create(tmpl).Error
}

func (r *characterTemplateRepo) Update(tmpl *crawl.CharacterTemplate) error {
	return r.db.Save(tmpl).Error
}

func (r *characterTemplateRepo) Delete(id uint) error {
	return r.db.Delete(&crawl.CharacterTemplate{}, id).Error
}
