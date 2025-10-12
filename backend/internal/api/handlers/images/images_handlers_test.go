package images

import (
	"dmd/backend/internal/api/common/utils"
	"dmd/backend/internal/model/images"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestMediaAssetCRUD(t *testing.T) {
	rs, _ := utils.SetupTestEnvironment(t, &images.ImageEntry{})
	handler := NewImagesHandler(rs, "/images/images")

	// Test CREATE
	var createdAsset images.ImageEntry
	t.Run("POST_Create", func(t *testing.T) {
		assetJSON := `{"name":"Town Map", "type":"map", "file_path":"images/maps/town.jpg"}`
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
	rs, db := utils.SetupTestEnvironment(t, &images.ImageEntry{})
	handler := NewImagesHandler(rs, "/images/images")

	// Seed Data
	db.Create(&images.ImageEntry{Name: "World Map", Type: images.ImageTypeMap, FilePath: "maps/world.png"})
	db.Create(&images.ImageEntry{Name: "Ogre Portrait", Type: images.ImageTypeImage, FilePath: "images/ogre.png"})
	db.Create(&images.ImageEntry{Name: "Dungeon Map", Type: images.ImageTypeMap, FilePath: "maps/dungeon.png"})

	t.Run("Filter_By_Type", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, handler.GetPath()+"?type=map", nil)
		rr := httptest.NewRecorder()
		handler.Get(rr, req)

		var results []*images.ImageEntry
		json.NewDecoder(rr.Body).Decode(&results)

		if len(results) != 2 {
			t.Errorf("expected 2 map images, got %d", len(results))
		}
	})
}
