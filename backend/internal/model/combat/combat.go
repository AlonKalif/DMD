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

    CombatID uint `gorm:"not null"` // Foreign key to the Combat

    // This is a polymorphic relationship.
    // A Combatant can be either a Character or an NPC.
    CombatantID   uint   `gorm:"not null"`
    CombatantType string `gorm:"not null"` // Will be "characters" or "npcs"

    Name       string `gorm:"not null"` // Copied for easy access
    Initiative uint   `gorm:"not null"`
    CurrentHP  uint
    IsActive   bool `gorm:"default:true"`

    // Flexible field for status effects like "Poisoned", "Prone", etc.
    StatusEffects datatypes.JSON
}
