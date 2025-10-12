package playlist_repo

import (
	"dmd/backend/internal/model/audio"
	"dmd/backend/internal/platform/storage/repos/common"
	"testing"
)

func TestCreatePlaylistTransaction(t *testing.T) {
	db := common.SetupTestDB(t, &audio.Playlist{}, &audio.Track{}, &audio.PlaylistTrack{})
	repo := NewPlaylistRepository(db)

	t.Run("Success_Case", func(t *testing.T) {
		playlistToCreate := &audio.Playlist{Name: "Combat Music"}

		createdPlaylist, err := repo.CreatePlaylist(playlistToCreate, []uint{})
		if err != nil {
			t.Fatalf("CreatePlaylist failed unexpectedly: %v", err)
		}

		var count int64
		db.Model(&audio.Playlist{}).Where("id = ?", createdPlaylist.ID).Count(&count)
		if count != 1 {
			t.Errorf("expected count to be 1, got %d", count)
		}
	})

	t.Run("Rollback_Case", func(t *testing.T) {
		// First, create a playlist that will cause a conflict.
		db.Create(&audio.Playlist{Name: "Duplicate Playlist Name"})

		// Now, try to create another one with the same name.
		// This will violate the UNIQUE constraint we added.
		playlistToCreate := &audio.Playlist{Name: "Duplicate Playlist Name"}

		_, err := repo.CreatePlaylist(playlistToCreate, []uint{})
		if err == nil {
			t.Fatal("CreatePlaylist was expected to fail but did not")
		}

		// The count should still be 1 because the transaction was rolled back.
		var count int64
		db.Model(&audio.Playlist{}).Where("name = ?", "Duplicate Playlist Name").Count(&count)
		if count != 1 {
			t.Errorf("expected count to be 1 after rollback, got %d", count)
		}
	})
}
