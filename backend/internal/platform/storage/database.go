// File: internal/storage/database.go
package storage

import (
    "dmd/backend/internal/model/audio"
    "dmd/backend/internal/model/character"
    "dmd/backend/internal/model/combat"
    "dmd/backend/internal/model/gameplay"
    "dmd/backend/internal/model/media"
    "log/slog"
    "time"

    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

// NewConnection creates a new database connection and configures its pool.
func NewConnection(log *slog.Logger, dbPath string) (*gorm.DB, error) {

    db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
    if err != nil {
        return nil, err
    }

    // Get the underlying sql.DB object to configure the connection pool.
    sqlDB, err := db.DB()
    if err != nil {
        return nil, err
    }

    // Set connection pool settings.
    sqlDB.SetMaxIdleConns(10)           // Max number of connections in the idle pool.
    sqlDB.SetMaxOpenConns(100)          // Max number of open connections to the database.
    sqlDB.SetConnMaxLifetime(time.Hour) // Max amount of time a connection may be reused.

    log.Info("Database connection pool established")
    return db, nil
}

func AutoMigrate(db *gorm.DB) error {
    return db.AutoMigrate(
        &character.Character{},
        &character.NPC{},
        &character.Ability{},
        &combat.Combat{},
        &combat.Combatant{},
        &gameplay.Spell{},
        &gameplay.Item{},
        &audio.Track{},
        &audio.Playlist{},
        &audio.PlaylistTrack{},
        &media.MediaAsset{},
    )
}
