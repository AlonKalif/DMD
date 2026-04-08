# Audio Player — Backend Documentation

## Table of Contents

- [1. Feature Overview](#1-feature-overview)
- [2. Architecture Summary](#2-architecture-summary)
- [3. Directory Map](#3-directory-map)
- [4. Data Models](#4-data-models)
  - [4.1 Track](#41-track)
  - [4.2 Playlist & PlaylistTrack](#42-playlist--playlisttrack)
  - [4.3 SpotifyToken](#43-spotifytoken)
- [5. Repository Layer](#5-repository-layer)
  - [5.1 TrackRepository](#51-trackrepository)
  - [5.2 PlaylistRepository](#52-playlistrepository)
- [6. HTTP Handlers (API Layer)](#6-http-handlers-api-layer)
  - [6.1 Handler Architecture](#61-handler-architecture)
  - [6.2 AudioHandler](#62-audiohandler)
  - [6.3 TracksHandler](#63-trackshandler)
  - [6.4 PlaylistsHandler](#64-playlistshandler)
- [7. Spotify Integration](#7-spotify-integration)
  - [7.1 SpotifyService](#71-spotifyservice)
  - [7.2 AuthHandler (Spotify OAuth)](#72-authhandler-spotify-oauth)
  - [7.3 OAuth Flow](#73-oauth-flow)
  - [7.4 Token Lifecycle](#74-token-lifecycle)
- [8. Routing & Middleware](#8-routing--middleware)
  - [8.1 API Routes](#81-api-routes)
  - [8.2 Spotify Auth Routes](#82-spotify-auth-routes)
  - [8.3 Middleware Chain](#83-middleware-chain)
- [9. Configuration](#9-configuration)
- [10. Database & Migrations](#10-database--migrations)
- [11. How the Frontend Consumes This](#11-how-the-frontend-consumes-this)
- [12. Key Design Decisions](#12-key-design-decisions)
- [13. Test Coverage](#13-test-coverage)
- [14. Dependencies](#14-dependencies)

---

## 1. Feature Overview

The Audio Player feature provides background music management for D&D sessions. It has two backend subsystems:

1. **Track & Playlist Management** — CRUD operations for audio track metadata and playlist organization, persisted in SQLite.
2. **Spotify Integration** — OAuth 2.0 authentication with the Spotify API, allowing the DM's Spotify account to be used as the playback engine.

The backend does **not** stream audio itself. It stores track metadata and manages Spotify credentials. Actual audio playback is handled entirely by the frontend (via the Spotify Web Playback SDK or equivalent client-side player). The backend's role is to:

- Persist the track library and playlist arrangements.
- Broker the Spotify OAuth flow and securely store/refresh tokens.
- Serve valid access tokens to the frontend on demand.

---

## 2. Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                          HTTP Server (Gorilla Mux)                  │
│                                                                     │
│  ┌──────────────────────────┐   ┌────────────────────────────────┐  │
│  │     API v1 Sub-Router    │   │     Middleware (Logging,       │  │
│  │                          │   │     Recovery, CORS)            │  │
│  │  /audio          ───────►│   AudioHandler (stub/base)        │  │
│  │  /audio/tracks   ───────►│   TracksHandler   ──► TrackRepo   │  │
│  │  /audio/playlists───────►│   PlaylistsHandler──► PlaylistRepo│  │
│  │                          │   │                                │  │
│  │  /auth/spotify/* ───────►│   AuthHandler ──► SpotifyService  │  │
│  └──────────────────────────┘   └────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    SQLite (via GORM)                          │   │
│  │  Tables: tracks, playlists, playlist_tracks, spotify_tokens  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

The flow is strictly layered: **Handler → Repository → Database** for track/playlist operations, and **Handler → Service → Database + Spotify API** for authentication.

---

## 3. Directory Map

Every file relevant to the audio player feature:

```
backend/
├── internal/
│   ├── api/
│   │   ├── common/
│   │   │   ├── errors/api_errors.go      # AppError type used by all handlers
│   │   │   ├── filters/filters.go        # TrackFilters, PlaylistFilters structs
│   │   │   ├── types.go                  # RoutingServices (carries SpotifyService ref)
│   │   │   └── utils/utils.go            # RespondWithJSON, RespondWithError helpers
│   │   ├── handlers/
│   │   │   ├── baseHandler.go            # BaseHandler with default 405 responses
│   │   │   ├── audio/
│   │   │   │   ├── audio_handlers.go     # AudioHandler (base, no methods implemented)
│   │   │   │   ├── playlist_handlers.go  # PlaylistsHandler (POST)
│   │   │   │   ├── track_handlers.go     # TracksHandler (GET, POST)
│   │   │   │   ├── playlist_handlers_test.go
│   │   │   │   └── track_handlers_test.go
│   │   │   └── spotify/
│   │   │       ├── auth_handler.go       # Login, Callback, Status, Token, Logout
│   │   │       └── routes.go             # RegisterSpotifyAuthRoutes
│   │   ├── middleware/middleware.go       # Logging + Recovery middleware
│   │   └── routes/
│   │       ├── apiRoutes.go              # Declares /audio, /audio/tracks, /audio/playlists
│   │       └── router.go                 # Registers Spotify routes conditionally
│   ├── model/audio/
│   │   ├── track.go                      # Track model + source constants
│   │   ├── playlist.go                   # Playlist + PlaylistTrack join table
│   │   └── spotify_token.go              # SpotifyToken singleton model
│   ├── platform/storage/
│   │   ├── database.go                   # NewConnection, AutoMigrate
│   │   └── repos/
│   │       ├── repository.go             # TrackRepository, PlaylistRepository interfaces
│   │       ├── track_repo/
│   │       │   ├── track_repo.go         # GORM implementation
│   │       │   └── track_repo_test.go
│   │       └── playlist_repo/
│   │           ├── playlist_repo.go      # GORM implementation (transactional create)
│   │           └── playlist_repo_test.go
│   ├── server/
│   │   ├── server.go                     # Server bootstrap, initSpotifyService
│   │   ├── server_config.json            # Runtime config (contains Spotify secrets)
│   │   └── server_config.example.json    # Template config
│   └── services/spotify/
│       └── spotify_service.go            # OAuth flow, token persist/refresh
└── go.mod                                # zmb3/spotify/v2, golang.org/x/oauth2
```

---

## 4. Data Models

All audio models live in `internal/model/audio/` and use GORM for ORM mapping to SQLite.

### 4.1 Track

**File:** `internal/model/audio/track.go`

```go
type Track struct {
    gorm.Model

    Title        string `gorm:"not null" json:"title"`
    Artist       string `json:"artist"`
    Duration     uint   `json:"duration"`       // seconds
    ThumbnailURL string `json:"thumbnail_url"`

    Source   string `gorm:"not null;index;uniqueIndex:idx_source_id" json:"source"`
    SourceID string `gorm:"not null;uniqueIndex:idx_source_id" json:"source_id"`

    Playlists []*Playlist `gorm:"many2many:playlist_tracks;" json:"-"`
}
```

**Key points:**

- `Source` + `SourceID` form a **composite unique index** (`idx_source_id`). This ensures a given track from a given source can only appear once in the database.
- Three source constants are defined: `SourceLocal` (`"local"`), `SourceYouTube` (`"youtube"`), `SourceSpotify` (`"spotify"`). The system is designed to be multi-source.
- `SourceID` semantics vary by source — it could be a file path for local tracks, a YouTube video ID, or a Spotify track URI.
- The `Playlists` relation is hidden from JSON output (`json:"-"`) to avoid circular serialization.
- `gorm.Model` provides `ID`, `CreatedAt`, `UpdatedAt`, `DeletedAt` (soft delete).

### 4.2 Playlist & PlaylistTrack

**File:** `internal/model/audio/playlist.go`

```go
type Playlist struct {
    gorm.Model
    Name        string   `gorm:"not null;unique" json:"name"`
    Description string   `json:"description"`
    Tracks      []*Track `gorm:"many2many:playlist_tracks;" json:"tracks,omitempty"`
}

type PlaylistTrack struct {
    PlaylistID uint `gorm:"primaryKey"`
    TrackID    uint `gorm:"primaryKey"`
    TrackOrder uint `gorm:"not null"`
}
```

**Key points:**

- `Playlist.Name` has a **unique constraint** — no two playlists can share a name.
- The many-to-many relationship goes through `PlaylistTrack`, an **explicit join table** that also stores `TrackOrder` for ordered playlists.
- When a playlist is fetched, GORM's `Preload("Tracks")` eagerly loads the associated tracks.

### 4.3 SpotifyToken

**File:** `internal/model/audio/spotify_token.go`

```go
type SpotifyToken struct {
    gorm.Model
    AccessToken  string    `gorm:"not null" json:"access_token"`
    RefreshToken string    `gorm:"not null" json:"refresh_token"`
    TokenType    string    `gorm:"not null" json:"token_type"`
    Expiry       time.Time `gorm:"not null" json:"expiry"`
}
```

**Key points:**

- Uses a **singleton pattern**: the row always has `ID = 1`. Since DMD is a single-user desktop application, there is only ever one Spotify account linked.
- `gorm.Model` provides soft-delete, but the `DeleteToken()` method uses `Unscoped().Delete()` for a **hard delete** (true logout).
- The `Save()` method is used for upserts — it creates the record if absent, or updates it if it already exists.

---

## 5. Repository Layer

Repositories follow the **interface-implementation pattern**: interfaces are declared centrally in `internal/platform/storage/repos/repository.go`, and concrete GORM implementations live in their own sub-packages.

### 5.1 TrackRepository

**Interface** (`repos/repository.go`):

```go
type TrackRepository interface {
    GetTrackByID(id uint) (*audio.Track, error)
    GetAllTracks(filters filters.TrackFilters) ([]*audio.Track, error)
    CreateTrack(track *audio.Track) error
    UpdateTrack(track *audio.Track) error
    DeleteTrack(id uint) error
    BulkCreateTracks(tracks []*audio.Track) error
}
```

**Implementation** (`repos/track_repo/track_repo.go`):

- `GetAllTracks` supports **filtering** by `Title` (LIKE), `Artist` (LIKE), `Source` (exact match), and **pagination** via `Page`/`PageSize`.
- `BulkCreateTracks` wraps inserts in a **GORM transaction** — if any track fails (e.g., duplicate source+sourceID), the entire batch rolls back.
- `CreateTrack`, `UpdateTrack`, `DeleteTrack` are thin wrappers around GORM's `Create`, `Save`, and `Delete`.

### 5.2 PlaylistRepository

**Interface** (`repos/repository.go`):

```go
type PlaylistRepository interface {
    GetPlaylistByID(id uint) (*audio.Playlist, error)
    GetAllPlaylists(filters filters.PlaylistFilters) ([]*audio.Playlist, error)
    CreatePlaylist(playlist *audio.Playlist, trackIDs []uint) (*audio.Playlist, error)
}
```

**Implementation** (`repos/playlist_repo/playlist_repo.go`):

- `CreatePlaylist` is **transactional**: it creates the playlist record, then inserts `PlaylistTrack` join records with sequential `TrackOrder` values. On any failure, the entire transaction rolls back.
- `GetPlaylistByID` and `GetAllPlaylists` use `Preload("Tracks")` to eagerly load associated tracks.
- `GetAllPlaylists` supports filtering by `Name` (LIKE) and pagination.

---

## 6. HTTP Handlers (API Layer)

### 6.1 Handler Architecture

All standard API handlers implement the `common.IHandler` interface:

```go
type IHandler interface {
    Get(w http.ResponseWriter, r *http.Request)
    Put(w http.ResponseWriter, r *http.Request)
    Post(w http.ResponseWriter, r *http.Request)
    Delete(w http.ResponseWriter, r *http.Request)
    GetPath() string
}
```

Handlers embed `handlers.BaseHandler`, which provides **default 405 (Method Not Allowed)** responses for all four HTTP methods. Concrete handlers override only the methods they support. This means any unsupported method on any audio endpoint automatically returns 405 without extra code.

Handlers are instantiated via a `HandlerCreator` function signature:

```go
type HandlerCreator func(rs *RoutingServices, path string) IHandler
```

The `RoutingServices` struct carries shared dependencies (logger, DB connection, WebSocket manager, services). Each handler receives it at construction time and extracts what it needs.

### 6.2 AudioHandler

**File:** `internal/api/handlers/audio/audio_handlers.go`  
**Route:** `GET/POST/PUT/DELETE /api/v1/audio`

A stub handler that currently implements no methods (all return 405). It exists as a namespace placeholder — the `/audio` path is registered in the route table, and the real functionality lives in the `/audio/tracks` and `/audio/playlists` sub-paths.

### 6.3 TracksHandler

**File:** `internal/api/handlers/audio/track_handlers.go`  
**Route:** `GET/POST /api/v1/audio/tracks` and `GET /api/v1/audio/tracks/{id}`

| Method | Behavior |
|--------|----------|
| `GET` (no `{id}`) | Returns all tracks, supports query params: `title`, `artist`, `source`, `page`, `pageSize` |
| `GET` (with `{id}`) | Returns a single track by ID, 404 if not found |
| `POST` | Creates a new track from JSON body |
| `PUT`, `DELETE` | Inherited 405 from `BaseHandler` |

The `Get` method checks for the presence of `{id}` in `mux.Vars(r)` to dispatch between single-item and list retrieval.

**Request body (POST):**

```json
{
  "title": "Tavern Ambiance",
  "artist": "DMD Soundscapes",
  "source": "local",
  "source_id": "audio/tavern.mp3",
  "duration": 180,
  "thumbnail_url": "https://..."
}
```

### 6.4 PlaylistsHandler

**File:** `internal/api/handlers/audio/playlist_handlers.go`  
**Route:** `POST /api/v1/audio/playlists`

| Method | Behavior |
|--------|----------|
| `POST` | Creates a new playlist with an optional list of track IDs |
| `GET`, `PUT`, `DELETE` | Inherited 405 from `BaseHandler` |

Uses a dedicated request struct to accept track IDs alongside playlist metadata:

```go
type createPlaylistRequest struct {
    Name        string `json:"name"`
    Description string `json:"description"`
    TrackIDs    []uint `json:"track_ids"`
}
```

The handler builds a `Playlist` model, delegates to the repository's transactional `CreatePlaylist`, and returns the created playlist with its tracks preloaded (HTTP 201).

---

## 7. Spotify Integration

### 7.1 SpotifyService

**File:** `internal/services/spotify/spotify_service.go`

The central service managing all Spotify OAuth interactions. It wraps the `zmb3/spotify/v2` authenticator and persists tokens via GORM.

**Construction:**

```go
func NewService(log, db, clientID, clientSecret, redirectURI) *Service
```

Configures the Spotify authenticator with these scopes:

| Scope | Purpose |
|-------|---------|
| `ScopeUserReadPrivate` | Read user's private profile info |
| `ScopeUserReadEmail` | Read user's email |
| `ScopeUserReadPlaybackState` | Read current playback state |
| `ScopeUserModifyPlaybackState` | Control playback (play, pause, skip) |
| `ScopeStreaming` | Stream audio via Web Playback SDK |
| `ScopePlaylistReadPrivate` | Read user's private playlists |
| `ScopePlaylistReadCollaborative` | Read collaborative playlists |

**Public methods:**

| Method | Description |
|--------|-------------|
| `GenerateAuthURL()` | Generates a Spotify OAuth URL with a cryptographically random state parameter. Returns `(url, state, error)`. |
| `ExchangeToken(ctx, code)` | Exchanges an authorization code for an OAuth token and persists it to the database. |
| `GetValidToken(ctx)` | Retrieves the stored token. If expired or within 30 seconds of expiry, **automatically refreshes** it via the Spotify API and saves the new token. |
| `IsAuthenticated()` | Checks whether a token row exists in the database (count query on `ID = 1`). |
| `DeleteToken()` | Hard-deletes the token row (unscoped delete, bypassing soft delete). |

### 7.2 AuthHandler (Spotify OAuth)

**File:** `internal/api/handlers/spotify/auth_handler.go`

An HTTP handler that exposes the OAuth flow and token management to the frontend. It does **not** implement `IHandler` — it uses direct `HandleFunc` registration because its endpoints don't follow the standard GET/POST/PUT/DELETE-on-one-path pattern.

**State management:** Uses an **in-memory `map[string]bool`** to store OAuth state strings for CSRF protection. Each state is generated by `GenerateAuthURL`, stored before redirect, validated on callback, and deleted after use. This is acceptable because DMD is a single-instance desktop application.

**Endpoints:**

| Endpoint | Method | Handler | Description |
|----------|--------|---------|-------------|
| `/auth/spotify/login` | GET | `Login` | Generates auth URL, stores state, redirects browser to Spotify |
| `/auth/spotify/callback` | GET | `Callback` | Receives code from Spotify, validates state, exchanges for token, returns HTML that auto-closes the popup |
| `/auth/spotify/status` | GET | `Status` | Returns `{"authenticated": true/false}` |
| `/auth/spotify/token` | GET | `Token` | Returns a valid access token (auto-refreshes if expired) |
| `/auth/spotify/logout` | POST | `Logout` | Deletes stored token |

### 7.3 OAuth Flow

The complete Spotify authentication flow as implemented:

```
 Frontend (Browser)                   Backend                          Spotify
 ──────────────────                   ───────                          ───────
       │                                  │                               │
  1.   │── GET /auth/spotify/login ──────►│                               │
       │                                  │── generate state + auth URL ──│
       │                                  │── store state in memory       │
       │◄── 307 Redirect to Spotify ──────│                               │
       │                                  │                               │
  2.   │──────────────────────────────────────── User authorizes ────────►│
       │                                  │                               │
  3.   │◄──── Redirect to /auth/spotify/callback?code=...&state=... ──────│
       │                                  │                               │
  4.   │── GET /auth/spotify/callback ───►│                               │
       │                                  │── validate state              │
       │                                  │── exchange code ─────────────►│
       │                                  │◄── access_token + refresh ────│
       │                                  │── save token to DB (ID=1)     │
       │◄── HTML: "Success! window.close()" │                             │
       │                                  │                               │
  5.   │── GET /auth/spotify/token ──────►│                               │
       │                                  │── load token from DB          │
       │                                  │── if expired: refresh ───────►│
       │                                  │◄── new token ─────────────────│
       │                                  │── save refreshed token to DB  │
       │◄── { access_token, expiry } ─────│                               │
```

**Step 1:** The frontend opens `/auth/spotify/login` in a popup window. The backend generates a random state string, stores it in memory, and redirects (307) to Spotify's authorization page.

**Step 2:** The user authorizes the application on Spotify's UI.

**Step 3:** Spotify redirects back to the callback URL with an authorization code and the state parameter.

**Step 4:** The backend validates the state against its in-memory store (CSRF protection), exchanges the code for an OAuth token via the Spotify API, and persists the token in SQLite. It responds with HTML that shows a success message and auto-closes the popup via `window.close()`.

**Step 5:** Subsequent requests to `/auth/spotify/token` retrieve the stored token, auto-refreshing if it's within 30 seconds of expiry.

### 7.4 Token Lifecycle

```
  Token requested by frontend
           │
           ▼
  ┌─ Load from DB (ID=1) ─┐
  │                        │
  │  Token missing? ──────►│── Return 404 "No authentication token found"
  │                        │
  │  Expiry > 30s away? ──►│── Return token as-is
  │                        │
  │  Expiry ≤ 30s away? ──►│── Call Spotify refresh endpoint
  │                        │── Save new token to DB
  │                        │── Return new token
  └────────────────────────┘
```

- The 30-second buffer prevents the frontend from receiving a token that expires before it can use it.
- Token refresh is **transparent** to the frontend — it always receives a valid token.
- On logout, the token is **hard-deleted** (bypasses GORM soft delete with `Unscoped()`), so `IsAuthenticated()` returns `false` immediately.

---

## 8. Routing & Middleware

### 8.1 API Routes

Declared in `internal/api/routes/apiRoutes.go` and registered on the `/api/v1` sub-router:

| Route | Handler | Supported Methods |
|-------|---------|-------------------|
| `/api/v1/audio` | `AudioHandler` | None (all 405) |
| `/api/v1/audio/tracks` | `TracksHandler` | GET, POST |
| `/api/v1/audio/playlists` | `PlaylistsHandler` | POST |

The route registration system in `router.go` iterates over the `apiRoutes` slice, creates a handler via its `HandlerCreator`, and registers all four HTTP methods on a dedicated sub-router for each path. The `BaseHandler` returns 405 for any method the concrete handler hasn't overridden.

### 8.2 Spotify Auth Routes

Registered **separately** in `internal/api/handlers/spotify/routes.go` because they don't follow the standard `IHandler` pattern (multiple distinct paths instead of one resource path):

| Route | Method | Handler Function |
|-------|--------|-----------------|
| `/api/v1/auth/spotify/login` | GET | `AuthHandler.Login` |
| `/api/v1/auth/spotify/callback` | GET | `AuthHandler.Callback` |
| `/api/v1/auth/spotify/status` | GET | `AuthHandler.Status` |
| `/api/v1/auth/spotify/token` | GET | `AuthHandler.Token` |
| `/api/v1/auth/spotify/logout` | POST | `AuthHandler.Logout` |

These routes are registered **conditionally**: only if `rs.SpotifyService != nil`. If Spotify credentials are not configured, the entire Spotify auth surface is absent from the router.

### 8.3 Middleware Chain

Applied globally to all routes via `router.go`:

1. **Recovery** — Catches panics, logs them, returns 500 with a generic error response.
2. **Logging** — Logs method, path, remote address, and request duration for every request.
3. **CORS** — Configured at the HTTP server level via `gorilla/handlers`. Allows origins `localhost:3000` and `127.0.0.1:3000` (the frontend dev server), methods GET/POST/PUT/DELETE, and `Content-Type`/`Authorization` headers.

---

## 9. Configuration

**File:** `internal/server/server_config.json` (runtime) / `server_config.example.json` (template)

```json
{
  "server_port": "8080",
  "db_path": "dmd.db",
  "assets_path": "public",
  "images_path": "public/images",
  "audios_path": "public/audio",
  "spotify_client_id": "YOUR_SPOTIFY_CLIENT_ID",
  "spotify_client_secret": "YOUR_SPOTIFY_CLIENT_SECRET",
  "spotify_redirect_uri": "http://127.0.0.1:8080/api/v1/auth/spotify/callback"
}
```

Audio-relevant fields:

| Field | Default | Description |
|-------|---------|-------------|
| `audios_path` | `public/audio` | Intended directory for local audio files. Currently declared in config but not actively used by any handler (the directory may not exist). |
| `spotify_client_id` | `""` | Spotify app client ID from the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard). |
| `spotify_client_secret` | `""` | Spotify app client secret. |
| `spotify_redirect_uri` | `http://127.0.0.1:8080/api/v1/auth/spotify/callback` | Must match the redirect URI registered in the Spotify app settings. |

**Graceful degradation:** If `spotify_client_id` or `spotify_client_secret` is empty, `initSpotifyService` returns `nil` and logs a warning. The router then skips Spotify route registration entirely. The track/playlist CRUD continues to work independently.

---

## 10. Database & Migrations

**File:** `internal/platform/storage/database.go`

- **Engine:** SQLite via `gorm.io/driver/sqlite`.
- **Connection pool:** 10 idle, 100 max open, 1-hour max lifetime.
- **Auto-migration** runs on every server startup. The audio-related models migrated are:
  - `audio.Track` → `tracks` table
  - `audio.Playlist` → `playlists` table
  - `audio.PlaylistTrack` → `playlist_tracks` table
  - `audio.SpotifyToken` → `spotify_tokens` table

GORM's `AutoMigrate` creates tables if absent and adds missing columns, but does **not** drop columns or change column types. Schema changes that remove or rename columns require manual migration.

---

## 11. How the Frontend Consumes This

The backend acts as a **metadata store and auth broker**. The expected frontend interaction pattern:

1. **Spotify login:** Frontend opens `/api/v1/auth/spotify/login` in a popup. After the OAuth dance, the popup auto-closes.
2. **Check auth status:** Frontend calls `GET /api/v1/auth/spotify/status` to know if Spotify is connected.
3. **Get playback token:** Frontend calls `GET /api/v1/auth/spotify/token` to get a valid Spotify access token. It uses this token with the Spotify Web Playback SDK to play audio directly in the browser.
4. **Manage library:** Frontend calls `GET/POST /api/v1/audio/tracks` and `POST /api/v1/audio/playlists` to manage the track library and playlists.
5. **Logout:** Frontend calls `POST /api/v1/auth/spotify/logout` to disconnect Spotify.

The backend never calls the Spotify playback API directly — it only handles auth tokens and track metadata persistence.

---

## 12. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Singleton token (ID=1)** | DMD is a single-user desktop app. There's no need for multi-user token storage. The `Save()` upsert pattern keeps it simple. |
| **In-memory OAuth state store** | Acceptable for a single-instance application. No need for Redis or DB-backed state since there's only one server process. |
| **Hard delete on logout** | `Unscoped().Delete()` bypasses soft delete so `IsAuthenticated()` can use a simple count query without checking `deleted_at`. |
| **30-second token refresh buffer** | Prevents race conditions where the frontend receives a token that expires before it can initiate playback. |
| **Conditional route registration** | Spotify routes are only registered when credentials are configured. This means the app runs cleanly without Spotify — no 500 errors on uninitialized service. |
| **Multi-source Track model** | The `Source`+`SourceID` composite key supports local files, YouTube, and Spotify tracks in a single table. Future sources can be added without schema changes. |
| **Explicit join table with ordering** | `PlaylistTrack` stores `TrackOrder`, enabling ordered playlists — essential for music playback UX. |
| **Separate auth route registration** | Spotify OAuth endpoints don't fit the standard CRUD `IHandler` interface (multiple paths, different HTTP semantics), so they're registered directly on the router. |
| **BaseHandler pattern** | Eliminates boilerplate for unsupported methods. Handlers only implement what they need; everything else returns 405 automatically. |

---

## 13. Test Coverage

Tests exist at both the **handler** and **repository** layers:

| Test File | What It Tests |
|-----------|--------------|
| `handlers/audio/track_handlers_test.go` | Track creation via POST, track filtering via GET (by artist, source) |
| `handlers/audio/playlist_handlers_test.go` | Playlist creation with associated tracks |
| `repos/track_repo/track_repo_test.go` | Bulk create (success + rollback on unique constraint violation) |
| `repos/playlist_repo/playlist_repo_test.go` | Transactional playlist create (success + rollback on name uniqueness violation) |

All tests use an in-memory SQLite database set up via `utils.SetupTestEnvironment` (handler tests) or `common.SetupTestDB` (repo tests), ensuring test isolation.

---

## 14. Dependencies

Audio-player-relevant dependencies from `go.mod`:

| Package | Version | Role |
|---------|---------|------|
| `github.com/zmb3/spotify/v2` | v2.4.3 | Spotify API client + OAuth authenticator |
| `golang.org/x/oauth2` | v0.33.0 | OAuth 2.0 token types and refresh logic |
| `github.com/gorilla/mux` | v1.8.1 | HTTP router with path variables |
| `github.com/gorilla/handlers` | v1.5.2 | CORS middleware |
| `gorm.io/gorm` | v1.31.0 | ORM for SQLite |
| `gorm.io/driver/sqlite` | v1.6.0 | SQLite driver for GORM |
