package audio

import (
	"time"

	"gorm.io/gorm"
)

// SpotifyToken stores the OAuth token for Spotify API access.
// Uses singleton pattern with ID always = 1 for single-user application.
type SpotifyToken struct {
	gorm.Model
	AccessToken  string    `gorm:"not null" json:"access_token"`
	RefreshToken string    `gorm:"not null" json:"refresh_token"`
	TokenType    string    `gorm:"not null" json:"token_type"`
	Expiry       time.Time `gorm:"not null" json:"expiry"`
}
