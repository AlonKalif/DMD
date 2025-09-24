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

    Name        string `gorm:"not null"`
    Description string

    // Type categorizes the asset.
    Type string `gorm:"not null;index"` // "map" or "image"

    // FilePath stores the relative path to the asset file.
    FilePath string `gorm:"not null;unique"`
}
