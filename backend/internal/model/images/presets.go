package images

import "gorm.io/gorm"

type LayoutType string

const (
	Single LayoutType = "single"
	Dual   LayoutType = "dual"
	Quad   LayoutType = "quad"
)

// PresetLayout represents the main preset record.
type PresetLayout struct {
	gorm.Model

	LayoutType LayoutType         `gorm:"not null" json:"layout_type"`
	Slots      []PresetLayoutSlot `gorm:"foreignKey:PresetLayoutID" json:"slots"` // Defines the "has many" relationship
}

// PresetLayoutSlot represents a single image within a preset layout.
type PresetLayoutSlot struct {
	gorm.Model // Adds ID, CreatedAt, etc.

	PresetLayoutID uint       `gorm:"not null" json:"-"`               // Foreign key to the PresetLayout
	ImageID        uint       `gorm:"not null" json:"-"`               // Foreign key to the ImageEntry
	SlotID         int        `gorm:"not null" json:"slot_id"`         // The position in the grid (0, 1, 2, 3)
	Zoom           float64    `gorm:"not null" json:"zoom"`            // The saved zoom level
	Image          ImageEntry `gorm:"foreignKey:ImageID" json:"image"` // Defines the "belongs to" relationship
}
