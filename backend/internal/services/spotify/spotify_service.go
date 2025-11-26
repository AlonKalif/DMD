package spotify

import (
	"context"
	"crypto/rand"
	"dmd/backend/internal/model/audio"
	"encoding/base64"
	"log/slog"
	"time"

	spotifyauth "github.com/zmb3/spotify/v2/auth"
	"golang.org/x/oauth2"
	"gorm.io/gorm"
)

const (
	tokenID = 1 // Singleton ID for single-user app
)

type Service struct {
	db          *gorm.DB
	auth        *spotifyauth.Authenticator
	log         *slog.Logger
	redirectURI string
}

func NewService(log *slog.Logger, db *gorm.DB, clientID, clientSecret, redirectURI string) *Service {
	auth := spotifyauth.New(
		spotifyauth.WithRedirectURL(redirectURI),
		spotifyauth.WithScopes(
			spotifyauth.ScopeUserReadPrivate,
			spotifyauth.ScopeUserReadPlaybackState,
			spotifyauth.ScopeUserModifyPlaybackState,
			spotifyauth.ScopeStreaming,
			spotifyauth.ScopePlaylistReadPrivate,
			spotifyauth.ScopePlaylistReadCollaborative,
		),
		spotifyauth.WithClientID(clientID),
		spotifyauth.WithClientSecret(clientSecret),
	)

	return &Service{
		db:          db,
		auth:        auth,
		log:         log,
		redirectURI: redirectURI,
	}
}

// GenerateAuthURL creates a new auth URL with a secure state string
func (s *Service) GenerateAuthURL() (string, string, error) {
	state, err := generateState()
	if err != nil {
		return "", "", err
	}
	url := s.auth.AuthURL(state)
	return url, state, nil
}

// ExchangeToken exchanges auth code for token and saves to DB
func (s *Service) ExchangeToken(ctx context.Context, code string) error {
	token, err := s.auth.Exchange(ctx, code)
	if err != nil {
		return err
	}

	return s.saveToken(token)
}

// GetValidToken retrieves token from DB, refreshing if expired
func (s *Service) GetValidToken(ctx context.Context) (*oauth2.Token, error) {
	var spotifyToken audio.SpotifyToken
	if err := s.db.First(&spotifyToken, tokenID).Error; err != nil {
		return nil, err
	}

	token := &oauth2.Token{
		AccessToken:  spotifyToken.AccessToken,
		RefreshToken: spotifyToken.RefreshToken,
		TokenType:    spotifyToken.TokenType,
		Expiry:       spotifyToken.Expiry,
	}

	// Check if token is expired or will expire soon (30 second buffer)
	if time.Until(token.Expiry) < 30*time.Second {
		s.log.Info("Token expired, refreshing...")
		newToken, err := s.auth.RefreshToken(ctx, token)
		if err != nil {
			return nil, err
		}
		if err := s.saveToken(newToken); err != nil {
			return nil, err
		}
		return newToken, nil
	}

	return token, nil
}

// IsAuthenticated checks if a valid token exists in the DB
func (s *Service) IsAuthenticated() bool {
	var count int64
	s.db.Model(&audio.SpotifyToken{}).Where("id = ?", tokenID).Count(&count)
	return count > 0
}

// saveToken saves or updates the token in the database (singleton pattern)
func (s *Service) saveToken(token *oauth2.Token) error {
	spotifyToken := audio.SpotifyToken{
		Model: gorm.Model{
			ID: tokenID,
		},
		AccessToken:  token.AccessToken,
		RefreshToken: token.RefreshToken,
		TokenType:    token.TokenType,
		Expiry:       token.Expiry,
	}

	// Use Save to update if exists, create if not
	return s.db.Save(&spotifyToken).Error
}

// generateState creates a secure random state string
func generateState() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}
