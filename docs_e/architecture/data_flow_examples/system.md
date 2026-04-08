#### Server Initialization Flow

1. **Logger**: Initialize structured logger (slog with tint for colored output)
2. **Configuration**: Load from `server_config.json` or use defaults
3. **Database**: Connect to SQLite via GORM
4. **Migrations**: Auto-migrate all models (non-destructive)
5. **Services**:
   - WebSocket Manager (runs in goroutine)
   - Image Service (file watcher + DB sync)
   - Spotify Service (OAuth handler)
6. **Router**: Initialize routes with middleware (logging, recovery, CORS)
7. **HTTP Server**: Start listening on port 8080