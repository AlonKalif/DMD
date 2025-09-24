// File: internal/model/track.go
package audio

import "gorm.io/gorm"

// Define constants for track sources to ensure consistency.
const (
    SourceLocal   = "local"
    SourceYouTube = "youtube"
    SourceSpotify = "spotify"
)

// Track represents a single audio track's metadata in the database.
type Track struct {
    gorm.Model

    Title    string `gorm:"not null"`
    Artist   string
    Duration uint // Duration in seconds

    // Source identifies where the track comes from.
    Source string `gorm:"not null;index"` // "local", "youtube", "spotify"

    // SourceID is the unique identifier for the track on its platform.
    SourceID string `gorm:"not null"` // e.g., File path, YouTube video ID, or Spotify track URI

    ThumbnailURL string // Optional URL for a track/video thumbnail
}
