// File: internal/model/images.go
package images

import "gorm.io/gorm"

// Define constants for asset types to ensure consistency.
const (
	ImageTypeUnknown = "unknown"
	ImageTypeMap     = "map"
	ImageTypeImage   = "image"
)

// ImageEntry represents a single visual asset (map, image, etc.) in the database.
type ImageEntry struct {
	gorm.Model

	Name        string `gorm:"not null" json:"name"`
	Description string `json:"description"`
	Type        string `gorm:"not null;index" json:"type"`
	FilePath    string `gorm:"not null;unique" json:"file_path"`
}
