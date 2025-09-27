// File: internal/model/media_asset.go
package media

import "gorm.io/gorm"

// Define constants for asset types to ensure consistency.
const (
    AssetTypeMap   = "map"
    AssetTypeImage = "image"
)

// MediaAsset represents a single visual asset (map, image, etc.) in the database.
type MediaAsset struct {
    gorm.Model

    Name        string `gorm:"not null" json:"name"`
    Description string `json:"description"`
    Type        string `gorm:"not null;index" json:"type"`
    FilePath    string `gorm:"not null;unique" json:"file_path"`
}
