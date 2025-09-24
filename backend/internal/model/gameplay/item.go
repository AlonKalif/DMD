// File: internal/model/item.go
package gameplay

import (
    "gorm.io/datatypes"
    "gorm.io/gorm"
)

// Item represents a single item's data, used as a reference.
type Item struct {
    gorm.Model

    Name        string `gorm:"not null;uniqueIndex"`
    Description string `gorm:"type:text"`

    // Categorization fields
    Type   string `gorm:"index"` // e.g., "Weapon", "Armor", "Potion", "Wondrous Item"
    Rarity string `gorm:"index"` // e.g., "Common", "Uncommon", "Rare"

    // Physical properties
    Weight float64
    Cost   string // e.g., "50 gp", "1,000 gp"

    // Game mechanics
    RequiresAttunement bool `gorm:"default:false"`

    // Flexible field for properties like "Finesse", "Heavy", "Ammunition"
    Properties datatypes.JSON
}
