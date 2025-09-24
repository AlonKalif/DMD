// File: /internal/model/gameplay/item.go
package gameplay

import (
    "gorm.io/datatypes"
    "gorm.io/gorm"
)

type Item struct {
    gorm.Model

    Name        string `gorm:"not null;uniqueIndex" json:"name"`
    Description string `gorm:"type:text" json:"description"`

    Type   string `gorm:"index" json:"type"`
    Rarity string `gorm:"index" json:"rarity"`

    Weight float64 `json:"weight"`
    Cost   string  `json:"cost"`

    RequiresAttunement bool           `gorm:"default:false" json:"requires_attunement"`
    Properties         datatypes.JSON `json:"properties"`
}
