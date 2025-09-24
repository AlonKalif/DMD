package common

import (
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
    "testing"
)

func SetupTestDB(t *testing.T, tables ...any) *gorm.DB {
    db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
    if err != nil {
        t.Fatalf("failed to connect to in-memory database: %v", err)
    }
    // Register a cleanup function to run when the test finishes.
    t.Cleanup(func() {
        // Drop all tables that were created.
        if err := db.Migrator().DropTable(tables...); err != nil {
            t.Fatalf("failed to drop tables: %v", err)
        }
    })
    //db.AutoMigrate(&character.Character{}, &character.Ability{})
    db.AutoMigrate(tables...)

    return db
}
