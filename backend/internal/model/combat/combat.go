// File: internal/model/combat.go
package combat

import (
    "gorm.io/datatypes"
    "gorm.io/gorm"
)

// Combat represents a single combat encounter.
type Combat struct {
    gorm.Model

    IsActive bool   `gorm:"default:true"`
    Name     string // Optional name, e.g., "Goblin Ambush"
    Round    uint   `gorm:"default:1"`

    // A combat has many combatants.
    Combatants []Combatant
}

// Combatant represents a single participant (a PC or NPC) in a combat.
type Combatant struct {
    gorm.Model

    // Add JSON tags to all fields that are part of the API payload
    CombatID      uint   `gorm:"not null;uniqueIndex:idx_combat_participant" json:"-"` // Usually set by the server, not the client
    CombatantID   uint   `gorm:"not null;uniqueIndex:idx_combat_participant" json:"combatant_id"`
    CombatantType string `gorm:"not null;uniqueIndex:idx_combat_participant" json:"combatant_type"`

    Name          string         `gorm:"not null" json:"name"`
    Initiative    uint           `gorm:"not null" json:"initiative"`
    CurrentHP     uint           `json:"current_hp"`
    IsActive      bool           `gorm:"default:true" json:"is_active"`
    StatusEffects datatypes.JSON `json:"status_effects"`
}
