## Backend Folder Structure

### `/backend` Directory

```
backend/
├── cmd/
│   └── main.go                 # Application entry point
├── internal/
│   ├── api/
│   │   ├── common/             # Shared types, errors, filters, utils
│   │   ├── handlers/           # HTTP request handlers
│   │   │   ├── audio/
│   │   │   ├── display/
│   │   │   ├── gameplay/       # Characters, NPCs, combat, items, spells
│   │   │   ├── healthChecker/
│   │   │   ├── images/         # Image CRUD, presets, upload
│   │   │   ├── spotify/        # Spotify OAuth handlers
│   │   │   ├── system/
│   │   │   ├── websocket/
│   │   │   └── baseHandler.go
│   │   ├── middleware/         # Logging, recovery, CORS
│   │   └── routes/
│   │       ├── apiRoutes.go    # Route definitions
│   │       └── router.go       # Router initialization
│   ├── model/                  # GORM database models
│   │   ├── audio/
│   │   │   ├── playlist.go
│   │   │   ├── spotify_token.go
│   │   │   └── track.go
│   │   ├── character/
│   │   │   ├── ability.go
│   │   │   ├── character.go
│   │   │   └── npc.go
│   │   ├── combat/
│   │   │   └── combat.go
│   │   ├── gameplay/
│   │   │   ├── item.go
│   │   │   └── spell.go
│   │   ├── images/
│   │   │   ├── images.go       # ImageEntry
│   │   │   └── presets.go      # PresetLayout, PresetLayoutSlot
│   │   └── websocket/
│   │       ├── event.go
│   │       └── message.go
│   ├── platform/
│   │   ├── logger/             # Structured logging (slog)
│   │   └── storage/
│   │       ├── repos/          # Repository interfaces + implementations
│   │       │   ├── ability_repo/
│   │       │   ├── character_repo/
│   │       │   ├── combat_repo/
│   │       │   ├── images_repo/
│   │       │   ├── item_repo/
│   │       │   ├── npc_repo/
│   │       │   ├── playlist_repo/
│   │       │   ├── spell_repo/
│   │       │   ├── track_repo/
│   │       │   └── repository.go    # Interface definitions
│   │       ├── database.go     # GORM setup
│   │       └── connection.go
│   ├── server/
│   │   ├── server.go                # Server initialization
│   │   ├── server_config.json       # Configuration (not in git)
│   │   └── server_config.example.json
│   └── services/
│       ├── images/             # Image sync + file watcher
│       ├── spotify/            # Spotify OAuth + API client
│       ├── watcher/            # Generic directory watcher
│       └── websocket/          # WebSocket manager
│           ├── client.go
│           └── manager.go
├── public/
│   ├── images/                 # User uploaded images (watched by fsnotify)
│   ├── audio/                  # Audio files
│   └── webapp/                 # Production frontend build (deployed)
├── dmd.db                      # SQLite database (created on first run)
├── dmd-server                  # Compiled binary (gitignored)
├── go.mod
└── go.sum
```
