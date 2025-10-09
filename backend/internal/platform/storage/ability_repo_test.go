package storage

import (
	"dmd/backend/internal/model/character"
	"dmd/backend/internal/platform/storage/common"
	"testing"
)

func TestAssignAbilitiesToCharacter(t *testing.T) {
	db := common.SetupTestDB(t, &character.Character{}, &character.Ability{})
	repo := NewAbilityRepository(db)

	// Define the test cases in a table (a slice of structs).
	testCases := []struct {
		name               string
		abilitiesToAssign  []*character.Ability
		expectErr          bool
		expectedCountAfter int64
	}{
		{
			name: "Success_Case",
			abilitiesToAssign: []*character.Ability{
				{Name: "Action Surge"},
				{Name: "Indomitable"},
			},
			expectErr:          false,
			expectedCountAfter: 2,
		},
		{
			name: "Rollback_Case_on_Duplicate",
			abilitiesToAssign: []*character.Ability{
				{Name: "Second Wind"},
				{Name: "Second Wind"}, // Duplicate name will cause a UNIQUE constraint violation
			},
			expectErr:          true,
			expectedCountAfter: 0, // Expect 0 because the transaction should be rolled back
		},
	}

	// Create a single character to be used by all sub-tests.
	seedChar := character.Character{Name: "Test Character"}
	db.Create(&seedChar)

	// Loop through the test cases and run each as a sub-test.
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// This cleanup function runs AFTER each sub-test, ensuring a clean slate for the next one.
			t.Cleanup(func() {
				db.Exec("DELETE FROM abilities WHERE character_id = ?", seedChar.ID)
			})

			err := repo.AssignAbilitiesToCharacter(seedChar.ID, tc.abilitiesToAssign)

			// Check if an error was expected.
			if tc.expectErr && err == nil {
				t.Fatal("Expected an error but got none")
			}
			if !tc.expectErr && err != nil {
				t.Fatalf("Did not expect an error but got: %v", err)
			}

			// Verify the final state of the database.
			var count int64
			db.Model(&character.Ability{}).Where("character_id = ?", seedChar.ID).Count(&count)
			if count != tc.expectedCountAfter {
				t.Errorf("expected count to be %d, got %d", tc.expectedCountAfter, count)
			}
		})
	}
}
