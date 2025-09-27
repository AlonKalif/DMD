// File: internal/model/playlist.go
package audio

import "gorm.io/gorm"

// Playlist represents a collection of tracks.
type Playlist struct {
    gorm.Model

    Name        string   `gorm:"not null;unique" json:"name"`
    Description string   `json:"description"`
    Tracks      []*Track `gorm:"many2many:playlist_tracks;" json:"tracks,omitempty"`
}

// PlaylistTrack is the explicit join table between playlists and tracks.
// It allows us to store additional information about the relationship, like track order.
type PlaylistTrack struct {
    PlaylistID uint `gorm:"primaryKey"`
    TrackID    uint `gorm:"primaryKey"`
    TrackOrder uint `gorm:"not null"` // The position of the track in the playlist
}
