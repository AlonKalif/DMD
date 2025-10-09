package storage

import (
	"dmd/backend/internal/model/audio"
	"dmd/backend/internal/platform/storage/common"
	"testing"
)

func TestBulkCreateTracks(t *testing.T) {
	db := common.SetupTestDB(t, &audio.Track{})
	repo := NewTrackRepository(db)

	t.Run("Success_Case", func(t *testing.T) {
		tracksToCreate := []*audio.Track{
			{Title: "Track 1", Source: audio.SourceLocal, SourceID: "file1.mp3"},
			{Title: "Track 2", Source: audio.SourceYouTube, SourceID: "yt1"},
		}
		err := repo.BulkCreateTracks(tracksToCreate)
		if err != nil {
			t.Fatalf("BulkCreate failed unexpectedly: %v", err)
		}

		var count int64
		db.Model(&audio.Track{}).Count(&count)
		if count != 2 {
			t.Errorf("expected count to be 2, got %d", count)
		}
	})

	t.Run("Rollback_Case", func(t *testing.T) {
		db.Exec("DELETE FROM tracks")

		// This will fail because the combination of Source and SourceID is a UNIQUE constraint.
		tracksToCreate := []*audio.Track{
			{Title: "Valid Track", Source: audio.SourceSpotify, SourceID: "spotify1"},
			{Title: "Duplicate Track", Source: audio.SourceSpotify, SourceID: "spotify1"},
		}

		err := repo.BulkCreateTracks(tracksToCreate)
		if err == nil {
			t.Fatal("BulkCreate was expected to fail but did not")
		}

		var count int64
		db.Model(&audio.Track{}).Count(&count)
		if count != 0 {
			t.Errorf("expected count to be 0 after rollback, got %d", count)
		}
	})
}
