package spotify

import (
	"dmd/backend/internal/api/common/errors"
	"dmd/backend/internal/api/common/utils"
	spotifyService "dmd/backend/internal/services/spotify"
	"log/slog"
	"net/http"
)

type AuthHandler struct {
	spotify *spotifyService.Service
	log     *slog.Logger
	states  map[string]bool // Simple in-memory state store
}

func NewAuthHandler(spotify *spotifyService.Service, log *slog.Logger) *AuthHandler {
	return &AuthHandler{
		spotify: spotify,
		log:     log,
		states:  make(map[string]bool),
	}
}

// Login initiates the OAuth flow
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	url, state, err := h.spotify.GenerateAuthURL()
	if err != nil {
		utils.RespondWithError(w, errors.NewInternalError("Failed to generate auth URL", err))
		return
	}

	// Store state for validation
	h.states[state] = true

	// Redirect to Spotify auth page
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// Callback handles the OAuth callback from Spotify
func (h *AuthHandler) Callback(w http.ResponseWriter, r *http.Request) {
	// Verify state
	state := r.URL.Query().Get("state")
	if !h.states[state] {
		http.Error(w, "Invalid state parameter", http.StatusBadRequest)
		return
	}
	delete(h.states, state) // Clean up used state

	// Check for error from Spotify
	if errMsg := r.URL.Query().Get("error"); errMsg != "" {
		h.log.Error("Spotify auth error", "error", errMsg)
		http.Error(w, "Authorization failed: "+errMsg, http.StatusBadRequest)
		return
	}

	// Exchange code for token
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "No code provided", http.StatusBadRequest)
		return
	}

	if err := h.spotify.ExchangeToken(r.Context(), code); err != nil {
		h.log.Error("Failed to exchange token", "error", err)
		http.Error(w, "Failed to complete authorization", http.StatusInternalServerError)
		return
	}

	// Return HTML that closes the popup window
	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(`
		<!DOCTYPE html>
		<html>
		<head><title>Authorization Successful</title></head>
		<body>
			<h1>Authorization Successful!</h1>
			<p>You can close this window now.</p>
			<script>window.close();</script>
		</body>
		</html>
	`))
}

// Status checks if user is authenticated
func (h *AuthHandler) Status(w http.ResponseWriter, r *http.Request) {
	isAuth := h.spotify.IsAuthenticated()
	utils.RespondWithJSON(w, http.StatusOK, map[string]bool{
		"authenticated": isAuth,
	})
}

// Token returns a valid access token (refreshing if needed)
func (h *AuthHandler) Token(w http.ResponseWriter, r *http.Request) {
	token, err := h.spotify.GetValidToken(r.Context())
	if err != nil {
		if err.Error() == "record not found" {
			utils.RespondWithError(w, errors.NewNotFoundError("No authentication token found", err))
			return
		}
		utils.RespondWithError(w, errors.NewInternalError("Failed to get token", err))
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"access_token": token.AccessToken,
		"token_type":   token.TokenType,
		"expiry":       token.Expiry,
	})
}
