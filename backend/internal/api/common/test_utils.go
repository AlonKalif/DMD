package common

import (
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
    "io"
    "log/slog"
    "testing"
)

// SetupTestEnvironment initializes a test-specific environment with an in-memory DB.
// It returns a fully configured RoutingServices struct and the GORM DB instance.
func SetupTestEnvironment(t *testing.T, models ...any) (*RoutingServices, *gorm.DB) {
    log := slog.New(slog.NewTextHandler(io.Discard, nil))

    // Use the test name in the DSN to ensure a unique, isolated in-memory DB for each test function.
    dsn := "file:" + t.Name() + "?mode=memory&cache=shared"
    db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
    if err != nil {
        t.Fatalf("failed to connect to in-memory database: %v", err)
    }

    // Register a cleanup function to drop all tables after the test.
    t.Cleanup(func() {
        if err := db.Migrator().DropTable(models...); err != nil {
            t.Fatalf("failed to drop tables: %v", err)
        }
    })

    // Auto-migrate the schema for the provided models.
    if err := db.AutoMigrate(models...); err != nil {
        t.Fatalf("failed to migrate database: %v", err)
    }

    routingServices := &RoutingServices{
        Log:          log,
        DbConnection: db,
        WsManager:    nil, // WsManager can be nil for most handler tests.
    }

    return routingServices, db
}
