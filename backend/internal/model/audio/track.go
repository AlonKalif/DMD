package audio

import "gorm.io/gorm"

const (
    SourceLocal   = "local"
    SourceYouTube = "youtube"
    SourceSpotify = "spotify"
)

type Track struct {
    gorm.Model

    Title        string `gorm:"not null" json:"title"`
    Artist       string `json:"artist"`
    Duration     uint   `json:"duration"` // Duration in seconds
    ThumbnailURL string `json:"thumbnail_url"`

    // Composite key to ensure a SourceID is unique for its Source
    Source   string `gorm:"not null;index;uniqueIndex:idx_source_id" json:"source"`
    SourceID string `gorm:"not null;uniqueIndex:idx_source_id" json:"source_id"`

    Playlists []*Playlist `gorm:"many2many:playlist_tracks;" json:"-"`
}
