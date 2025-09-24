// File: internal/model/spell.go
package gameplay

import "gorm.io/gorm"

// Spell represents a single spell's data, used as a reference.
type Spell struct {
    gorm.Model

    Name                   string `gorm:"not null;uniqueIndex"` // e.g., "Fireball"
    Description            string `gorm:"type:text"`            // The main spell description.
    HigherLevelDescription string `gorm:"type:text"`            // Description for casting at higher levels.

    Level       uint   `gorm:"not null;default:0"` // 0 for cantrips, 1-9 for leveled spells.
    CastingTime string `gorm:"not null"`           // e.g., "1 Action", "10 Minutes"
    Range       string `gorm:"not null"`           // e.g., "Self", "60 feet"
    Duration    string `gorm:"not null"`           // e.g., "Instantaneous", "1 Minute"
    School      string `gorm:"not null"`           // e.g., "Evocation", "Illusion"

    IsConcentration bool `gorm:"default:false"`
    IsRitual        bool `gorm:"default:false"`

    // Spell Components
    ComponentV            bool `gorm:"default:false"` // Verbal
    ComponentS            bool `gorm:"default:false"` // Somatic
    ComponentM            bool `gorm:"default:false"` // Material
    MaterialComponentDesc string
}
