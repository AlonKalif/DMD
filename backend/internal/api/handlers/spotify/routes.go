package spotify

import (
	spotifyService "dmd/backend/internal/services/spotify"
	"log/slog"

	"github.com/gorilla/mux"
)

// RegisterSpotifyAuthRoutes registers all Spotify authentication endpoints
func RegisterSpotifyAuthRoutes(router *mux.Router, spotify *spotifyService.Service, log *slog.Logger) {
	handler := NewAuthHandler(spotify, log)

	router.HandleFunc("/auth/spotify/login", handler.Login).Methods("GET")
	router.HandleFunc("/auth/spotify/callback", handler.Callback).Methods("GET")
	router.HandleFunc("/auth/spotify/status", handler.Status).Methods("GET")
	router.HandleFunc("/auth/spotify/token", handler.Token).Methods("GET")
	router.HandleFunc("/auth/spotify/logout", handler.Logout).Methods("POST")
}
