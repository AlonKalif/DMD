package assets

import (
    "dmd/backend/internal/api/common"
    "dmd/backend/internal/model/media"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "strings"
    "testing"
)

func TestMediaAssetCRUD(t *testing.T) {
    rs, _ := common.SetupTestEnvironment(t, &media.MediaAsset{})
    handler := NewMediaAssetsHandler(rs, "/assets/media")

    // Test CREATE
    var createdAsset media.MediaAsset
    t.Run("POST_Create", func(t *testing.T) {
        assetJSON := `{"name":"Town Map", "type":"map", "file_path":"assets/maps/town.jpg"}`
        req := httptest.NewRequest(http.MethodPost, handler.GetPath(), strings.NewReader(assetJSON))
        req.Header.Set("Content-Type", "application/json")
        rr := httptest.NewRecorder()
        handler.Post(rr, req)

        if status := rr.Code; status != http.StatusCreated {
            t.Fatalf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
        }
        json.NewDecoder(rr.Body).Decode(&createdAsset)
        if createdAsset.ID == 0 {
            t.Fatal("expected created asset to have a non-zero ID")
        }
    })

    // Add other sub-tests for GET by ID, UPDATE, and DELETE...
}

func TestMediaAssetFiltering(t *testing.T) {
    rs, db := common.SetupTestEnvironment(t, &media.MediaAsset{})
    handler := NewMediaAssetsHandler(rs, "/assets/media")

    // Seed Data
    db.Create(&media.MediaAsset{Name: "World Map", Type: media.AssetTypeMap, FilePath: "maps/world.png"})
    db.Create(&media.MediaAsset{Name: "Ogre Portrait", Type: media.AssetTypeImage, FilePath: "images/ogre.png"})
    db.Create(&media.MediaAsset{Name: "Dungeon Map", Type: media.AssetTypeMap, FilePath: "maps/dungeon.png"})

    t.Run("Filter_By_Type", func(t *testing.T) {
        req, _ := http.NewRequest(http.MethodGet, handler.GetPath()+"?type=map", nil)
        rr := httptest.NewRecorder()
        handler.Get(rr, req)

        var results []*media.MediaAsset
        json.NewDecoder(rr.Body).Decode(&results)

        if len(results) != 2 {
            t.Errorf("expected 2 map assets, got %d", len(results))
        }
    })
}
