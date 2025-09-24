package character

import (
    "gorm.io/datatypes"
    "gorm.io/gorm"
)

// NPC represents a non-player character, monster, or creature in the database.
type NPC struct {
    gorm.Model // Includes ID, CreatedAt, UpdatedAt, DeletedAt

    // Basic Info
    Name      string `gorm:"not null;unique"`
    Type      string // e.g., "Humanoid", "Beast", "Fiend"
    Race      string
    Alignment string
    // A text block for the DM's private notes (appearance, personality, plot hooks).
    Description string

    // Core Stats
    Strength     uint `gorm:"default:10"`
    Dexterity    uint `gorm:"default:10"`
    Constitution uint `gorm:"default:10"`
    Intelligence uint `gorm:"default:10"`
    Wisdom       uint `gorm:"default:10"`
    Charisma     uint `gorm:"default:10"`

    // Combat Stats
    MaxHP           uint   `gorm:"default:10"`
    CurrentHP       uint   `gorm:"default:10"`
    ArmorClass      uint   `gorm:"default:10"`
    Speed           uint   `gorm:"default:30"`
    ChallengeRating string // e.g., "1/4", "5"

    // Custom Fields
    CustomFields datatypes.JSON
}
