package crawl

import (
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type CharacterTemplate struct {
	gorm.Model
	Name         string         `json:"name" gorm:"not null"`
	Race         string         `json:"race"`
	Class        string         `json:"class"`
	PhotoPath    string         `json:"photo_path"`
	Level        uint           `json:"level"`
	HP           uint           `json:"hp"`
	MaxHP        uint           `json:"max_hp"`
	AC           uint           `json:"ac"`
	Color        string         `json:"color"`
	CustomFields datatypes.JSON `json:"custom_fields"`
}
