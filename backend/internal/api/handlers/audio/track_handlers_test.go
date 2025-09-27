package audio

import (
    "dmd/backend/internal/api/common"
    "dmd/backend/internal/model/audio"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "strings"
    "testing"
)

func TestTrackCRUD(t *testing.T) {
    rs, _ := common.SetupTestEnvironment(t, &audio.Track{})
    handler := NewTracksHandler(rs, "/audio/tracks")

    var createdTrack audio.Track

    t.Run("CREATE_Success", func(t *testing.T) {
        trackJSON := `{"title":"Tavern Ambiance", "artist":"DMD Soundscapes", "source":"local", "source_id":"audio/tavern.mp3"}`
        req, err := http.NewRequest(http.MethodPost, handler.GetPath(), strings.NewReader(trackJSON))
        if err != nil {
            t.Fatal(err)
        }
        req.Header.Set("Content-Type", "application/json")
        rr := httptest.NewRecorder()
        handler.Post(rr, req)

        if status := rr.Code; status != http.StatusCreated {
            t.Fatalf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
        }
        json.NewDecoder(rr.Body).Decode(&createdTrack)
        if createdTrack.ID == 0 {
            t.Fatal("expected created track to have a non-zero ID")
        }
    })
}

func TestTrackFiltering(t *testing.T) {
    rs, db := common.SetupTestEnvironment(t, &audio.Track{})
    handler := NewTracksHandler(rs, "/audio/tracks")

    db.Create(&audio.Track{Title: "Forest Day", Artist: "Nature SFX", Source: audio.SourceLocal, SourceID: "audio/forest.mp3"})
    db.Create(&audio.Track{Title: "Epic Battle Music", Artist: "Composer A", Source: audio.SourceYouTube, SourceID: "yt_video_1"})
    db.Create(&audio.Track{Title: "Village Market", Artist: "Nature SFX", Source: audio.SourceLocal, SourceID: "audio/market.mp3"})

    t.Run("Filter_By_Artist", func(t *testing.T) {
        req, err := http.NewRequest(http.MethodGet, handler.GetPath()+"?artist=Composer A", nil)
        if err != nil {
            t.Fatalf("Failed to create request: %v", err)
        }

        rr := httptest.NewRecorder()
        handler.Get(rr, req)

        if status := rr.Code; status != http.StatusOK {
            t.Fatalf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
        }

        var results []*audio.Track
        json.NewDecoder(rr.Body).Decode(&results)
        if len(results) != 1 {
            t.Errorf("expected 1 track from Composer A, got %d", len(results))
        }
    })
}
