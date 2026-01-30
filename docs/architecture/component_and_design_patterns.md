## Architecture

DMD uses a modern full-stack architecture with a Go backend server, React frontend, and dual-window browser interface for seamless DM-to-player content delivery.


### Component Responsibilities

#### **Chrome Browser**
- **DM Window**: Control interface for managing content, playlists, combat, etc.
- **Player Window**: Fullscreen display window (typically on second monitor/projector)
- **BroadcastChannel**: Direct browser-to-browser communication for instant updates

#### **Go Backend Server**
- **REST API**: CRUD operations for all resources (images, presets, characters, etc.)
- **WebSocket Manager**: Real-time event broadcasting to connected clients
- **Image Service**: Syncs filesystem images with database, manages file watcher
- **Spotify Service**: OAuth flow, token management, API client for Spotify integration
- **File Watcher**: Detects filesystem changes and triggers database sync
- **Middleware**: Logging, CORS, panic recovery

#### **SQLite Database**
- **Embedded Database**: Single-file, portable, no external dependencies
- **Auto-Migration**: Schema updates handled by GORM on startup
- **Soft Deletes**: Uses GORM's DeletedAt for data recovery

#### **File System**
- **public/images/**: User-uploaded images (watched by fsnotify)
- **public/audio/**: Local audio files for future local playback feature
- **public/webapp/**: Production frontend build (served as static files)

#### **External Services**
- **Spotify Web API**: OAuth authentication, playlist fetching, playback control

### Design Patterns

| Pattern | Implementation | Purpose |
|---------|---------------|---------|
| **Repository Pattern** | Database operations abstracted behind interfaces | Decouples data access from business logic, enables testing with mocks |
| **Handler Pattern** | Each API endpoint has a dedicated handler | Single responsibility, clear organization |
| **Service Pattern** | Business logic encapsulated in service layers | Separates concerns, reusable across handlers |
| **Middleware Pattern** | Request/response interception | Cross-cutting concerns (logging, CORS, recovery) |
| **Observer Pattern** | WebSocket broadcasts events to clients | Real-time updates without polling |
| **Pub/Sub Pattern** | File system watcher publishes change events | Loose coupling between filesystem and database sync |
| **Singleton Pattern** | Spotify token stored with ID=1 in database | Single source of truth for OAuth tokens |
