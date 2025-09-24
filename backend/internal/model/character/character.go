package character

import (
    "gorm.io/datatypes"
    "gorm.io/gorm"
)

// Character represents a player character in the database.
type Character struct {
    gorm.Model // Includes ID, CreatedAt, UpdatedAt, DeletedAt

    // Basic Info
    Name             string `gorm:"not null"`
    Class            string
    Level            uint `gorm:"default:1"`
    Race             string
    Background       string
    Alignment        string
    ExperiencePoints uint `gorm:"default:0"`
    Inspiration      bool `gorm:"default:false"`

    // Core Stats
    Strength     uint `gorm:"default:10"`
    Dexterity    uint `gorm:"default:10"`
    Constitution uint `gorm:"default:10"`
    Intelligence uint `gorm:"default:10"`
    Wisdom       uint `gorm:"default:10"`
    Charisma     uint `gorm:"default:10"`

    // Combat Stats
    MaxHP            uint `gorm:"default:10"`
    CurrentHP        uint `gorm:"default:10"`
    TemporaryHP      uint `gorm:"default:0"`
    ArmorClass       uint `gorm:"default:10"`
    Speed            uint `gorm:"default:30"`
    ProficiencyBonus uint `gorm:"-"` // This is a derived stat, not stored in DB
    Initiative       uint `gorm:"default:2"`
    HitDice          uint `gorm:"default:10"`

    // Custom Fields
    // A flexible JSON field to store any additional character data.
    CustomFields datatypes.JSON
}
