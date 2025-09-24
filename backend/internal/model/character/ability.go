package character

import "gorm.io/gorm"

// Ability represents a special feature, trait, or action a character has.
type Ability struct {
    gorm.Model

    CharacterID uint   // The foreign key to link this ability to a character
    Name        string `gorm:"not null"`
    Description string
    Type        string // e.g., "Passive", "Action", "Bonus Action", "Racial Trait"
    Uses        uint   // Max number of uses, 0 for unlimited
    Used        uint   // How many times it has been used
}
