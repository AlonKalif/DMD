package character

import "gorm.io/gorm"

// Ability represents a special feature, trait, or action a character has.
type Ability struct {
    gorm.Model

    CharacterID uint   `json:"character_id" gorm:"uniqueIndex:idx_char_ability"`
    Name        string `gorm:"not null;uniqueIndex:idx_char_ability" json:"name"`
    Description string `json:"description"`
    Type        string `json:"type"` // e.g., "Passive", "Action", "Bonus Action", "Racial Trait"
    Uses        uint   `json:"uses"` // Max number of uses, 0 for unlimited
    Used        uint   `json:"used"`
}
