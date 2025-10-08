package audio

import (
	"dmd/backend/internal/api/common/utils"
	"dmd/backend/internal/model/audio"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
)

func TestCreatePlaylistHandler(t *testing.T) {
	// Setup requires all three related models for the many-to-many relationship.
	rs, db := utils.SetupTestEnvironment(t, &audio.Playlist{}, &audio.Track{}, &audio.PlaylistTrack{})
	handler := NewPlaylistsHandler(rs, "/audio/playlists")

	// Seed some tracks to add to the playlist.
	track1 := audio.Track{Title: "Tavern Song", Source: "s1", SourceID: "sid1"}
	track2 := audio.Track{Title: "Forest Ambiance", Source: "s2", SourceID: "sid2"}
	db.Create(&track1)
	db.Create(&track2)

	t.Run("Create_With_Tracks_Success", func(t *testing.T) {
		playlistJSON := `{
			"name": "My First Playlist",
			"description": "For adventuring",
			"track_ids": [` + strconv.Itoa(int(track1.ID)) + `,` + strconv.Itoa(int(track2.ID)) + `]
		}`
		req := httptest.NewRequest(http.MethodPost, handler.GetPath(), strings.NewReader(playlistJSON))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()

		handler.Post(rr, req)

		if status := rr.Code; status != http.StatusCreated {
			t.Fatalf("%s", rr.Body.String())
			t.Fatalf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
		}

		var createdPlaylist audio.Playlist
		json.NewDecoder(rr.Body).Decode(&createdPlaylist)

		if createdPlaylist.Name != "My First Playlist" {
			t.Errorf("expected name to be 'My First Playlist', got %s", createdPlaylist.Name)
		}
		if len(createdPlaylist.Tracks) != 2 {
			t.Errorf("expected playlist to have 2 tracks, got %d", len(createdPlaylist.Tracks))
		}
	})
}
