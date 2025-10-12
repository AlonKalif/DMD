package images_repo

import (
	"dmd/backend/internal/model/images"
	"dmd/backend/internal/platform/storage/repos/common"
	"testing"
)

func TestBulkCreateMediaAssets(t *testing.T) {
	db := common.SetupTestDB(t, &images.ImageEntry{})
	repo := NewImagesRepository(db)

	testCases := []struct {
		name               string
		assetsToCreate     []*images.ImageEntry
		expectErr          bool
		expectedCountAfter int64
	}{
		{
			name: "Success_Case",
			assetsToCreate: []*images.ImageEntry{
				{Name: "Asset 1", Type: images.ImageTypeImage, FilePath: "path/1.jpg"},
				{Name: "Asset 2", Type: images.ImageTypeMap, FilePath: "path/2.jpg"},
			},
			expectErr:          false,
			expectedCountAfter: 2,
		},
		{
			name: "Rollback_Case_on_Duplicate",
			assetsToCreate: []*images.ImageEntry{
				{Name: "Valid Asset", Type: images.ImageTypeImage, FilePath: "path/valid.jpg"},
				{Name: "Duplicate Asset", Type: images.ImageTypeImage, FilePath: "path/valid.jpg"}, // Duplicate FilePath
			},
			expectErr:          true,
			expectedCountAfter: 0, // Transaction should fail and roll back, leaving 0 new entries
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// This cleanup function runs AFTER each sub-test, guaranteeing isolation.
			// It uses the CORRECT table name, "image_entries".
			t.Cleanup(func() {
				db.Exec("DELETE FROM image_entries")
			})

			err := repo.BulkCreateImageEntries(tc.assetsToCreate)

			// Check if an error was expected.
			if tc.expectErr && err == nil {
				t.Fatal("Expected an error but got none")
			}
			if !tc.expectErr && err != nil {
				t.Fatalf("Did not expect an error but got: %v", err)
			}

			// Verify the final state of the database.
			var count int64
			db.Model(&images.ImageEntry{}).Count(&count)
			if count != tc.expectedCountAfter {
				t.Errorf("expected count to be %d, got %d", tc.expectedCountAfter, count)
			}
		})
	}
}
