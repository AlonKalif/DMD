// File: internal/model/spell.go
package gameplay

import "gorm.io/gorm"

// Spell represents a single spell's data, used as a reference.
type Spell struct {
    gorm.Model

    Name                   string `gorm:"not null;uniqueIndex" json:"name"`
    Description            string `gorm:"type:text" json:"description"`
    HigherLevelDescription string `gorm:"type:text" json:"higher_level_description"`
    Level                  uint   `gorm:"not null;default:0;index" json:"level"`
    CastingTime            string `gorm:"not null" json:"casting_time"`
    Range                  string `gorm:"not null" json:"range"`
    Duration               string `gorm:"not null" json:"duration"`
    School                 string `gorm:"not null;index" json:"school"`
    IsConcentration        bool   `gorm:"default:false" json:"is_concentration"`
    IsRitual               bool   `gorm:"default:false" json:"is_ritual"`
    ComponentV             bool   `gorm:"default:false" json:"component_v"`
    ComponentS             bool   `gorm:"default:false" json:"component_s"`
    ComponentM             bool   `gorm:"default:false" json:"component_m"`
    MaterialComponentDesc  string `json:"material_component_desc"`
}
