package storage

import (
    "dmd/backend/internal/model/character"
    "dmd/backend/internal/platform/storage/common"
    "testing"
)

func TestAssignAbilitiesToCharacter(t *testing.T) {
    db := common.SetupTestDB(t, &character.Character{}, &character.Ability{})
    repo := NewAbilityRepository(db)

    seedChar := character.Character{Name: "Test Character"}
    db.Create(&seedChar)

    t.Run("Success_Case", func(t *testing.T) {
        abilitiesToAssign := []*character.Ability{
            {Name: "Action Surge"},
            {Name: "Indomitable"},
        }
        err := repo.AssignAbilitiesToCharacter(seedChar.ID, abilitiesToAssign)
        if err != nil {
            t.Fatalf("AssignAbilities failed unexpectedly: %v", err)
        }
        var count int64
        db.Model(&character.Ability{}).Where("character_id = ?", seedChar.ID).Count(&count)
        if count != 2 {
            t.Errorf("expected count to be 2, got %d", count)
        }
    })

    t.Run("Rollback_Case", func(t *testing.T) {
        // Clean up table for this test
        db.Exec("DELETE FROM abilities WHERE character_id = ?", seedChar.ID)

        // Create a slice that will cause a UNIQUE constraint violation.
        duplicateAbilities := []*character.Ability{
            {Name: "Action Surge"},
            {Name: "Action Surge"}, // Duplicate
        }

        err := repo.AssignAbilitiesToCharacter(seedChar.ID, duplicateAbilities)
        if err == nil {
            t.Fatal("AssignAbilities was expected to fail but did not")
        }

        var count int64
        db.Model(&character.Ability{}).Where("character_id = ?", seedChar.ID).Count(&count)
        if count != 0 {
            t.Errorf("expected count to be 0 after rollback, got %d", count)
        }
    })
}
