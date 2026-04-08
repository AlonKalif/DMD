# Screen Mirroring — Backend Documentation

## Table of Contents

- [1. Feature Overview](#1-feature-overview)
- [2. Architecture Summary](#2-architecture-summary)
- [3. Directory Map](#3-directory-map)
- [4. Data Models](#4-data-models)
  - [4.1 ImageEntry](#41-imageentry)
  - [4.2 PresetLayout & PresetLayoutSlot](#42-presetlayout--presetlayoutslot)
- [5. Repository Layer](#5-repository-layer)
  - [5.1 ImagesRepository Interface](#51-imagesrepository-interface)
  - [5.2 Image Operations](#52-image-operations)
  - [5.3 Preset Operations](#53-preset-operations)
- [6. HTTP Handlers (API Layer)](#6-http-handlers-api-layer)
  - [6.1 Handler Architecture](#61-handler-architecture)
  - [6.2 DisplayHandler (Stub)](#62-displayhandler-stub)
  - [6.3 ImagesHandler](#63-imageshandler)
  - [6.4 ImageTypeHandler](#64-imagetypehandler)
  - [6.5 PresetHandler](#65-presethandler)
  - [6.6 UploadHandler](#66-uploadhandler)
- [7. Image Service Layer](#7-image-service-layer)
  - [7.1 Service Overview](#71-service-overview)
  - [7.2 Filesystem-Database Sync](#72-filesystem-database-sync)
  - [7.3 Directory Watcher](#73-directory-watcher)
- [8. WebSocket Layer (Real-Time Sync)](#8-websocket-layer-real-time-sync)
  - [8.1 Manager (Hub)](#81-manager-hub)
  - [8.2 Client](#82-client)
  - [8.3 Event & Message Models](#83-event--message-models)
  - [8.4 Screen Mirroring Event Flow](#84-screen-mirroring-event-flow)
- [9. Static File Serving](#9-static-file-serving)
- [10. Routing & Middleware](#10-routing--middleware)
  - [10.1 API Routes](#101-api-routes)
  - [10.2 WebSocket Route](#102-websocket-route)
  - [10.3 Static File Route](#103-static-file-route)
  - [10.4 Middleware Chain](#104-middleware-chain)
- [11. Server Bootstrap & Wiring](#11-server-bootstrap--wiring)
- [12. Configuration](#12-configuration)
- [13. Database & Migrations](#13-database--migrations)
- [14. How the Frontend Consumes This](#14-how-the-frontend-consumes-this)
- [15. Key Design Decisions](#15-key-design-decisions)
- [16. Test Coverage](#16-test-coverage)
- [17. Dependencies](#17-dependencies)

---

## 1. Feature Overview

The Screen Mirroring feature enables a dual-window system where the Dungeon Master (DM) controls which images, maps, and visual layouts are displayed to players. The DM operates a control panel while a separate player-facing display shows the selected content. Both windows are browser tabs on the same machine, kept in sync via WebSocket.

The backend's role in Screen Mirroring is to:

- **Persist visual assets** — Store metadata (name, type, file path) for images and maps in SQLite. The actual image files live on disk under `public/images/`.
- **Serve image files** — Expose a static file server so both DM and player windows can load images via HTTP.
- **Manage preset layouts** — Allow the DM to save and recall pre-configured display arrangements (single, dual, or quad image grids) with per-slot zoom levels.
- **Handle image uploads** — Accept new image files from the DM and persist them to the images directory.
- **Sync the filesystem with the database** — Automatically detect when image files are added or removed from disk and update the database accordingly.
- **Broadcast real-time updates** — Notify all connected clients (both DM and player windows) via WebSocket when the image library changes, so their views stay in sync.

The backend does **not** implement display logic itself. It provides the data layer (images, presets, layout metadata) and the real-time notification channel. The frontend handles all rendering, display selection, and dual-window coordination.

---

## 2. Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          HTTP Server (Gorilla Mux)                              │
│                                                                                 │
│  ┌──────────────────────────────┐   ┌─────────────────────────────────────────┐ │
│  │     API v1 Sub-Router        │   │     Middleware (Logging, Recovery, CORS) │ │
│  │                              │   └─────────────────────────────────────────┘ │
│  │  /display           ────────►│   DisplayHandler (stub, all 405)              │
│  │  /images/images     ────────►│   ImagesHandler  ──► ImagesRepository ──► DB  │
│  │  /images/images/{id}────────►│   ImagesHandler  ──► ImagesRepository ──► DB  │
│  │  /images/types      ────────►│   ImageTypeHandler──► ImagesRepository ──► DB │
│  │  /images/presets    ────────►│   PresetHandler  ──► ImagesRepository ──► DB  │
│  │  /images/presets/{id}───────►│   PresetHandler  ──► ImagesRepository ──► DB  │
│  │  /images/upload     ────────►│   UploadHandler  ──► ImageService ──► Disk    │
│  └──────────────────────────────┘                                               │
│                                                                                 │
│  ┌───────────────────────────┐   ┌────────────────────────────────────────────┐ │
│  │  /static/*  (File Server) │   │  /ws  (WebSocket)                         │ │
│  │  Serves public/images/*   │   │  Manager ◄──── ImageService broadcasts    │ │
│  │  to DM + Player windows   │   │     ├── Client (DM window)                │ │
│  └───────────────────────────┘   │     └── Client (Player window)            │ │
│                                  └────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐       │
│  │                     ImageService (Background)                        │       │
│  │  DirWatcher (fsnotify) ──► Sync disk ↔ DB ──► Broadcast via WS      │       │
│  └──────────────────────────────────────────────────────────────────────┘       │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐       │
│  │                    SQLite (via GORM)                                  │       │
│  │  Tables: image_entries, preset_layouts, preset_layout_slots          │       │
│  └──────────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

The backend supports Screen Mirroring through five cooperating subsystems:

1. **REST API** — CRUD for image entries, type queries, preset layouts, and image uploads.
2. **Static File Server** — Serves actual image files from `public/` so both browser windows can render them.
3. **Image Service** — Background service that syncs the filesystem with the database and triggers WebSocket broadcasts.
4. **Directory Watcher** — Monitors the images directory for filesystem events (create, remove, rename) and triggers re-sync.
5. **WebSocket** — A pub-sub broadcast system that pushes `images_updated` events to all connected clients.

The data flow is strictly layered: **Handler → Repository → Database** for CRUD operations, and **DirWatcher → ImageService → Repository + WebSocket Manager** for filesystem-driven sync.

---

## 3. Directory Map

Every backend file relevant to the Screen Mirroring feature:

```
backend/
├── cmd/main.go                                    # Entry point — delegates to server.New() and RunServer()
├── internal/
│   ├── api/
│   │   ├── common/
│   │   │   ├── errors/api_errors.go               # AppError type used by all handlers
│   │   │   ├── filters/filters.go                 # ImagesFilters struct (name, type, pagination)
│   │   │   ├── types.go                           # IHandler, HandlerCreator, RoutingServices
│   │   │   └── utils/
│   │   │       ├── utils.go                       # RespondWithJSON, RespondWithError, GetIDFromRequest
│   │   │       └── test_utils.go                  # SetupTestEnvironment for handler tests
│   │   ├── handlers/
│   │   │   ├── baseHandler.go                     # BaseHandler — default 405 for all methods
│   │   │   ├── display/
│   │   │   │   └── display_handlers.go            # DisplayHandler (stub, no methods overridden)
│   │   │   ├── images/
│   │   │   │   ├── images_handlers.go             # ImagesHandler — CRUD for image entries
│   │   │   │   ├── images_handlers_test.go        # Tests for image CRUD and filtering
│   │   │   │   ├── image_type_handlers.go         # ImageTypeHandler — list distinct image types
│   │   │   │   ├── preset_handlers.go             # PresetHandler — create/list/delete preset layouts
│   │   │   │   └── upload_handler.go              # UploadHandler — multipart image upload to disk
│   │   │   └── websocket/
│   │   │       └── websocket_handler.go           # HTTP → WebSocket upgrade, client registration
│   │   ├── middleware/middleware.go                # Logging + Recovery middleware
│   │   └── routes/
│   │       ├── apiRoutes.go                       # Declares /display, /images/* routes
│   │       ├── router.go                          # Assembles router: static files, WS, API sub-router
│   │       └── router_test.go                     # Integration test for route registration
│   ├── model/
│   │   ├── images/
│   │   │   ├── images.go                          # ImageEntry model + type constants
│   │   │   └── presets.go                         # PresetLayout, PresetLayoutSlot, LayoutType
│   │   └── websocket/
│   │       ├── event.go                           # Event (outgoing WS message: type + payload)
│   │       └── message.go                         # Message (incoming WS message) + ChatMessage
│   ├── platform/
│   │   └── storage/
│   │       ├── database.go                        # SQLite connection, AutoMigrate (includes image models)
│   │       └── repos/
│   │           ├── repository.go                  # ImagesRepository interface definition
│   │           ├── images_repo/
│   │           │   ├── images_repo.go             # GORM implementation of ImagesRepository
│   │           │   └── images_repo_test.go        # Tests for bulk create + rollback
│   │           └── common/
│   │               └── test_utils.go              # SetupTestDB for repo-level tests
│   ├── server/
│   │   └── server.go                              # Server bootstrap — wires ImageService, WsManager
│   └── services/
│       ├── images/
│       │   └── image_service.go                   # ImageService — sync, watcher init, broadcast
│       ├── watcher/
│       │   └── dir_watcher_service.go             # Generic fsnotify directory watcher
│       └── websocket/
│           ├── manager.go                         # WS Manager (hub) — register, unregister, broadcast
│           └── client.go                          # WS Client — ReadPump, WritePump goroutines
└── public/
    └── images/                                    # Image files served via /static/images/*
        └── templates/                             # Subfolder for template images
```

---

## 4. Data Models

All image-related models live in `internal/model/images/` and use GORM for ORM mapping to SQLite.

### 4.1 ImageEntry

**File:** `internal/model/images/images.go`

```go
type ImageEntry struct {
    gorm.Model

    Name        string `gorm:"not null" json:"name"`
    Description string `json:"description"`
    Type        string `gorm:"not null;index" json:"type"`
    FilePath    string `gorm:"not null;unique" json:"file_path"`
}
```

**Key points:**

- Represents a single visual asset (map, character portrait, scene image, etc.) tracked in the database.
- `FilePath` has a **unique constraint** — each physical file maps to exactly one database record. The path is stored relative to the `public/` directory (e.g., `images/dark_castle.jpg`).
- `Type` is indexed for efficient filtered queries. Three type constants are defined: `"unknown"`, `"map"`, and `"image"`. New images default to `"unknown"` and can be reclassified by the DM via the API.
- `Name` is auto-derived from the filename (minus extension) when an image is discovered on disk, but can be updated by the DM.
- `gorm.Model` provides `ID`, `CreatedAt`, `UpdatedAt`, `DeletedAt` (soft delete). Soft delete is significant for the sync logic — removed files are soft-deleted and can be restored if the same file reappears on disk.

### 4.2 PresetLayout & PresetLayoutSlot

**File:** `internal/model/images/presets.go`

```go
type LayoutType string

const (
    Single LayoutType = "single"
    Dual   LayoutType = "dual"
    Quad   LayoutType = "quad"
)

type PresetLayout struct {
    gorm.Model

    LayoutType LayoutType         `gorm:"not null" json:"layout_type"`
    Slots      []PresetLayoutSlot `gorm:"foreignKey:PresetLayoutID" json:"slots"`
}

type PresetLayoutSlot struct {
    gorm.Model

    PresetLayoutID uint       `gorm:"not null" json:"-"`
    ImageID        uint       `gorm:"not null" json:"image_id"`
    SlotID         int        `gorm:"not null" json:"slot_id"`
    Zoom           float64    `gorm:"not null" json:"zoom"`
    Image          ImageEntry `gorm:"foreignKey:ImageID" json:"image"`
}
```

**Key points:**

- `PresetLayout` represents a saved display configuration that the DM can recall instantly during a session. It captures the grid layout type and the images assigned to each slot.
- `LayoutType` supports three grid configurations:
  - `single` — One full-screen image.
  - `dual` — Two images side by side.
  - `quad` — Four images in a 2×2 grid.
- `PresetLayoutSlot` is the child record in a one-to-many relationship. Each slot records:
  - `SlotID` — Position in the grid (0 for single, 0-1 for dual, 0-3 for quad).
  - `ImageID` — Foreign key to the `ImageEntry` being displayed.
  - `Zoom` — The saved zoom level for that slot, allowing the DM to save a specific crop/zoom.
- `PresetLayoutSlot.Image` is eagerly loaded via GORM `Preload("Slots.Image")` when fetching presets, so the API response includes the full image metadata for each slot without additional queries.
- `PresetLayoutID` is excluded from JSON output (`json:"-"`) to avoid leaking internal foreign keys to the frontend.

---

## 5. Repository Layer

The repository follows the **interface-implementation pattern**: the interface is declared centrally in `internal/platform/storage/repos/repository.go`, and the concrete GORM implementation lives in `internal/platform/storage/repos/images_repo/images_repo.go`.

### 5.1 ImagesRepository Interface

```go
type ImagesRepository interface {
    // Image entry operations
    GetImageByID(id uint) (*images.ImageEntry, error)
    GetAllImages(filters filters.ImagesFilters) ([]*images.ImageEntry, error)
    GetAllTypes() ([]string, error)
    CreateImageEntry(asset *images.ImageEntry) error
    UpdateImageEntry(asset *images.ImageEntry) error
    DeleteImage(id uint) error
    RestoreSoftDeletedByPath(path string) (bool, error)
    GetImageByPath(path string) (*images.ImageEntry, error)
    BulkCreateImageEntries(assets []*images.ImageEntry) error

    // Preset layout operations
    CreatePreset(preset *images.PresetLayout) error
    GetAllPresets() ([]*images.PresetLayout, error)
    DeletePreset(id uint) error
}
```

A single interface covers both image entries and preset layouts. This is a pragmatic choice — both deal with visual assets stored in the same subsystem.

### 5.2 Image Operations

- `GetAllImages` supports **filtering** by `Name` (LIKE/partial match) and `Type` (exact match), plus **pagination** via `Page`/`PageSize` query parameters.
- `GetAllTypes` returns a distinct, sorted list of non-empty, non-`"unknown"` type values. Useful for populating filter dropdowns in the UI.
- `DeleteImage` performs a **soft delete** (GORM's default). The record is marked with a `DeletedAt` timestamp but not removed.
- `RestoreSoftDeletedByPath` reverses a soft delete by setting `DeletedAt` back to `NULL`. This is used by the sync logic when a previously deleted file reappears on disk.
- `BulkCreateImageEntries` wraps multiple inserts in a **GORM transaction** — if any insert fails (e.g., duplicate `FilePath`), the entire batch rolls back.

### 5.3 Preset Operations

- `CreatePreset` creates a `PresetLayout` and its associated `PresetLayoutSlot` records in a single GORM insert (GORM handles nested creates via the `Slots` relation).
- `GetAllPresets` eagerly loads slots and their associated images using `Preload("Slots.Image")`, and returns results ordered by `created_at desc` (most recent first).
- `DeletePreset` soft-deletes a preset by ID.

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

Handlers embed `handlers.BaseHandler`, which provides **default 405 (Method Not Allowed)** responses for all four HTTP methods. Concrete handlers override only the methods they support.

Handlers are instantiated via a `HandlerCreator` function:

```go
type HandlerCreator func(rs *RoutingServices, path string) IHandler
```

The `RoutingServices` struct carries shared dependencies (logger, DB connection, WebSocket manager, ImageService). Each handler extracts what it needs at construction time.

### 6.2 DisplayHandler (Stub)

**File:** `internal/api/handlers/display/display_handlers.go`
**Route:** `GET/POST/PUT/DELETE /api/v1/display`

```go
type DisplayHandler struct {
    handlers.BaseHandler
    log *slog.Logger
}
```

A **placeholder handler** that currently implements no methods — all HTTP methods return 405. The route is registered as a namespace reservation for future display-state management endpoints (e.g., persisting what is currently shown on the player display, controlling display mode from the DM panel).

Currently, the display coordination between DM and player windows is handled entirely on the frontend via WebSocket messages. The `/display` endpoint exists to provide a future anchor for server-side display state if needed.

### 6.3 ImagesHandler

**File:** `internal/api/handlers/images/images_handlers.go`
**Routes:** `/api/v1/images/images` and `/api/v1/images/images/{id}`

| Method | Behavior |
|--------|----------|
| `GET` (no `{id}`) | Returns all image entries. Supports query params: `name` (partial match), `type` (exact match), `page`, `pageSize`. |
| `GET` (with `{id}`) | Returns a single image entry by ID. Returns 404 if not found. |
| `POST` | Creates a new image entry from a JSON body. |
| `PUT` | Updates an existing image entry by ID (extracted from URL). |
| `DELETE` | Soft-deletes an image entry by ID. Returns 204 No Content. |

The `Get` method inspects `mux.Vars(r)` for the `{id}` path variable to dispatch between list and single-item retrieval.

**POST request body example:**

```json
{
  "name": "Town Map",
  "type": "map",
  "file_path": "images/maps/town.jpg"
}
```

**PUT request body example:**

```json
{
  "name": "Town Map (Updated)",
  "description": "Updated map of the central town plaza",
  "type": "map",
  "file_path": "images/maps/town.jpg"
}
```

**Note:** The handler currently accesses the repository directly rather than going through the ImageService. There is a code comment flagging this for refactoring: `// Refactor. Handler should use the image service instead of image repo`.

### 6.4 ImageTypeHandler

**File:** `internal/api/handlers/images/image_type_handlers.go`
**Route:** `GET /api/v1/images/types`

| Method | Behavior |
|--------|----------|
| `GET` | Returns a JSON array of distinct, non-empty, non-`"unknown"` image type strings currently present in the database. Returns `[]` if none exist. |
| `POST`, `PUT`, `DELETE` | Inherited 405 from `BaseHandler`. |

This endpoint powers the filter/category UI in the DM's image browser panel.

### 6.5 PresetHandler

**File:** `internal/api/handlers/images/preset_handlers.go`
**Routes:** `/api/v1/images/presets` and `/api/v1/images/presets/{id}`

| Method | Behavior |
|--------|----------|
| `GET` | Returns all saved preset layouts with their slots and image data fully populated. Ordered by most recently created. |
| `POST` | Creates a new preset layout with its associated slots. Expects a `PresetLayout` JSON body with nested `Slots`. |
| `DELETE` (with `{id}`) | Soft-deletes a preset layout by ID. Returns 204 No Content. |
| `PUT` | Explicitly returns 405 — presets are immutable; delete and recreate instead. |

**POST request body example (dual layout):**

```json
{
  "layout_type": "dual",
  "slots": [
    { "slot_id": 0, "image_id": 1, "zoom": 1.0 },
    { "slot_id": 1, "image_id": 5, "zoom": 1.5 }
  ]
}
```

**GET response example:**

```json
[
  {
    "ID": 1,
    "CreatedAt": "2025-03-15T20:00:00Z",
    "layout_type": "dual",
    "slots": [
      {
        "slot_id": 0,
        "image_id": 1,
        "zoom": 1.0,
        "image": { "ID": 1, "name": "Town Map", "type": "map", "file_path": "images/town.jpg" }
      },
      {
        "slot_id": 1,
        "image_id": 5,
        "zoom": 1.5,
        "image": { "ID": 5, "name": "Goblin", "type": "image", "file_path": "images/goblin.png" }
      }
    ]
  }
]
```

### 6.6 UploadHandler

**File:** `internal/api/handlers/images/upload_handler.go`
**Route:** `POST /api/v1/images/upload`

| Method | Behavior |
|--------|----------|
| `POST` | Accepts a multipart form upload (field name: `file`), validates the content type, and saves the file to the images directory. |
| `GET`, `PUT`, `DELETE` | Explicitly return 405. |

**Upload flow:**

1. Parses multipart form data with a 10 MB max size.
2. Validates the content type against an allowlist: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`.
3. Generates a unique filename if a file with the same name already exists (appends `_1`, `_2`, etc.).
4. Writes the file to the images directory on disk.
5. Returns HTTP 201 with the filename.

The upload handler does **not** create a database record itself. Instead, the file landing on disk triggers the **directory watcher**, which detects the new file, syncs it into the database, and broadcasts an `images_updated` WebSocket event. This decoupled design means images can be added to the directory by any means (upload, manual copy, etc.) and the system will pick them up.

**Request example:**

```
POST /api/v1/images/upload
Content-Type: multipart/form-data

file: [binary image data]
```

**Response example:**

```json
{
  "message": "File uploaded successfully",
  "filename": "dark_castle.jpg"
}
```

---

## 7. Image Service Layer

### 7.1 Service Overview

**File:** `internal/services/images/image_service.go`

The `ImageService` is the central coordinator for filesystem-to-database synchronization and real-time notifications. It bridges three subsystems:

```
                                  ┌─────────────┐
  Filesystem (public/images/) ───►│ DirWatcher  │
                                  └──────┬──────┘
                                         │ fsnotify event
                                         ▼
                                  ┌─────────────┐
                                  │ImageService │──► ImagesRepository ──► SQLite
                                  └──────┬──────┘
                                         │ Broadcast
                                         ▼
                                  ┌─────────────┐
                                  │ WS Manager  │──► All connected clients
                                  └─────────────┘
```

**Construction:**

```go
func NewService(log, repo, wsManager, imagesPath) *Service
```

At construction, the service immediately performs an initial filesystem-database sync (`SyncImageEntriesWithDatabase()`). It then provides `RunImagesDirWatcher()` to start the background file watcher.

**Dependencies:**

| Dependency | Role |
|-----------|------|
| `ImagesRepository` | Read/write image entries in the database |
| `websocket.Manager` | Broadcast events to connected clients |
| `watcher.Service` | Monitor the images directory for changes |

### 7.2 Filesystem-Database Sync

The `SyncImageEntriesWithDatabase()` method performs a **two-way reconciliation** between what exists on disk and what's recorded in the database:

```
  Sync Process
  ────────────
  1. Scan disk   → map[filePath]bool
  2. Query DB    → map[filePath]uint (path → ID)
  3. Remove orphans: for each DB record not on disk → soft-delete
  4. Add new files: for each disk file not in DB →
       a. If soft-deleted record exists for path → restore it
       b. Else → create new record (name from filename, type = "unknown")
```

**Key behaviors:**

- **Orphan removal:** If a file was deleted from disk, the corresponding database record is soft-deleted. This preserves the record's metadata (name, type, description) in case the file returns.
- **Restore on re-add:** If a file that was previously soft-deleted reappears on disk, the existing record is restored (its `DeletedAt` is set back to `NULL`) rather than creating a duplicate. This preserves any DM-assigned metadata.
- **Auto-naming:** New files get their name from the filename (without extension). For example, `dark_castle.jpg` becomes `"dark_castle"`.
- **Default type:** New files are assigned type `"unknown"`. The DM can reclassify them via the images PUT endpoint.

This sync runs at two points:
1. **On service construction** (server startup) — ensures the database reflects the current state of the images directory.
2. **On filesystem events** — triggered by the directory watcher whenever a file is created, removed, or renamed.

### 7.3 Directory Watcher

**File:** `internal/services/watcher/dir_watcher_service.go`

A generic filesystem watcher built on `fsnotify`. It is not specific to images — it's a reusable utility that accepts a directory path and a callback function.

```go
type OnDirEvent func(event fsnotify.Event) error

type Service struct {
    log        *slog.Logger
    dirToWatch string
    handler    OnDirEvent
}
```

**Lifecycle:**

1. `NewService(log, dir, handler)` — Stores configuration.
2. `Run()` — Creates an `fsnotify.Watcher`, starts a goroutine to listen for events, and adds the directory to the watch list. Runs indefinitely in the background.

The event listener calls the provided `handler` function for every filesystem event. For the Image Service, the handler filters for `Create`, `Remove`, and `Rename` events and triggers a full sync + WebSocket broadcast:

```go
func (s *Service) imagesDirEventHandler(event fsnotify.Event) error {
    if event.Has(fsnotify.Create) || event.Has(fsnotify.Remove) || event.Has(fsnotify.Rename) {
        s.SyncImageEntriesWithDatabase()
        s.wsManager.Broadcast(websocket.Event{Type: "images_updated"})
    }
    return nil
}
```

The watcher only monitors the top-level images directory, not subdirectories. Files placed in subdirectories like `templates/` are not automatically tracked.

---

## 8. WebSocket Layer (Real-Time Sync)

The WebSocket system is a shared infrastructure used by multiple features. For Screen Mirroring, it serves as the real-time notification channel that keeps DM and player windows synchronized.

### 8.1 Manager (Hub)

**File:** `internal/services/websocket/manager.go`

The `Manager` implements a classic pub-sub hub pattern:

```go
type Manager struct {
    clients    map[*Client]bool        // Connected clients
    broadcast  chan websocket.Event     // Outgoing events to all clients
    register   chan *Client             // New client registration
    unregister chan *Client             // Client disconnection
    log        *slog.Logger
    handlers   map[string]MessageHandler // Incoming message dispatchers
}
```

The `Run()` method is the Manager's main event loop, running in its own goroutine. It processes three channel types:

1. **register** — Adds a new client to the connected set.
2. **unregister** — Removes a client and closes its send channel.
3. **broadcast** — Marshals an `Event` to JSON and fans it out to **every** connected client. If a client's send buffer is full, it is evicted (channel closed, removed from map).

**Broadcast is indiscriminate:** Every connected client receives every event. There is no concept of rooms, channels, or per-client filtering. This is appropriate for DMD's single-session, same-machine architecture where all connected tabs belong to the same DM.

The Manager also supports **incoming message handling** via a `handlers` map. Currently, only one handler is registered:

| Message Type | Handler | Description |
|-------------|---------|-------------|
| `send_message` | `handleChatMessage` | Processes chat messages and re-broadcasts them as `new_chat_message` events |

### 8.2 Client

**File:** `internal/services/websocket/client.go`

Represents a single WebSocket connection (one per browser tab):

```go
type Client struct {
    conn    *websocket.Conn
    manager *Manager
    send    chan []byte    // Buffered channel (256 messages)
}
```

Each client runs two goroutines:

- **ReadPump** — Reads incoming messages, unmarshals them into `Message` structs, and dispatches to the appropriate handler via `manager.handlers[msg.Type]`. On error, the client unregisters and closes the connection.
- **WritePump** — Drains the `send` channel and writes each message to the WebSocket connection. On write error, the connection is closed.

### 8.3 Event & Message Models

**File:** `internal/model/websocket/event.go` (outgoing)

```go
type Event struct {
    Type    string `json:"type"`
    Payload any    `json:"payload"`
}
```

**File:** `internal/model/websocket/message.go` (incoming)

```go
type Message struct {
    Type    string          `json:"type"`
    Payload json.RawMessage `json:"payload"`
}
```

The incoming `Message.Payload` uses `json.RawMessage` for deferred parsing — the manager reads the `Type` to select a handler, and the handler unmarshals `Payload` into the specific type it expects.

### 8.4 Screen Mirroring Event Flow

The primary WebSocket event relevant to Screen Mirroring is `images_updated`:

```
  Filesystem Event (file added/removed)
           │
           ▼
  DirWatcher detects event
           │
           ▼
  ImageService.imagesDirEventHandler()
           │
           ├──► SyncImageEntriesWithDatabase()  (update DB)
           │
           └──► wsManager.Broadcast(Event{Type: "images_updated"})
                    │
                    ▼
               Manager.Run() event loop
                    │
                    ├──► DM window receives {"type": "images_updated"}
                    │         └──► Frontend refreshes image library
                    │
                    └──► Player window receives {"type": "images_updated"}
                              └──► Frontend refreshes image library
```

The `images_updated` event carries no payload — it is a simple notification that the image library has changed. The receiving frontend is expected to re-fetch the image list via `GET /api/v1/images/images` to get the updated data.

**Note on display commands:** The actual "show this image on the player display" and "change the layout" commands are currently handled **entirely on the frontend** via WebSocket messages between the two browser windows. The backend's WebSocket layer provides the transport, but the display-coordination message types and payloads are defined and processed by the frontend, not the backend.

---

## 9. Static File Serving

**File:** `internal/api/routes/router.go`

```go
fs := http.FileServer(http.Dir(staticAssetsPath))
newRouter.PathPrefix("/static/").Handler(http.StripPrefix("/static/", fs))
```

The router mounts a standard `http.FileServer` at `/static/`, serving files from the `public/` directory. This is how both the DM and player browser windows load actual image files.

**Example URL mapping:**

| Disk Path | HTTP URL |
|----------|----------|
| `public/images/dark_castle.jpg` | `http://localhost:8080/static/images/dark_castle.jpg` |
| `public/images/Phandalin.jpg` | `http://localhost:8080/static/images/Phandalin.jpg` |
| `public/images/templates/goblin.png` | `http://localhost:8080/static/images/templates/goblin.png` |

The `staticAssetsPath` is configured via `server_config.json` (field: `assets_path`, default: `"public"`).

---

## 10. Routing & Middleware

### 10.1 API Routes

Declared in `internal/api/routes/apiRoutes.go` and registered on the `/api/v1` sub-router:

| Route | Handler | Supported Methods |
|-------|---------|-------------------|
| `/api/v1/display` | `DisplayHandler` | None (all 405 — stub) |
| `/api/v1/images/images` | `ImagesHandler` | GET, POST |
| `/api/v1/images/images/{id}` | `ImagesHandler` | GET, PUT, DELETE |
| `/api/v1/images/types` | `ImageTypeHandler` | GET |
| `/api/v1/images/presets` | `PresetHandler` | GET, POST |
| `/api/v1/images/presets/{id}` | `PresetHandler` | DELETE |
| `/api/v1/images/upload` | `UploadHandler` | POST |

The route registration system in `router.go` iterates over the `apiRoutes` slice, creates a handler via its `HandlerCreator`, and registers all four HTTP methods on a dedicated sub-router for each path. The `BaseHandler` returns 405 for any method the concrete handler hasn't overridden.

### 10.2 WebSocket Route

Registered directly on the main router (not under `/api/v1`):

| Route | Protocol | Handler |
|-------|----------|---------|
| `/ws` | WebSocket (Upgrade) | `websocket_handler.serveWs` |

The WebSocket endpoint uses `gorilla/websocket`'s `Upgrader` with `CheckOrigin` set to accept all origins (development configuration). On successful upgrade, the handler creates a `Client`, registers it with the `Manager`, and starts its `ReadPump` and `WritePump` goroutines.

### 10.3 Static File Route

| Route | Handler |
|-------|---------|
| `/static/*` | `http.FileServer` serving from `public/` |

Registered on the main router with `PathPrefix`, so any path starting with `/static/` maps to the filesystem under `public/`.

### 10.4 Middleware Chain

Applied globally to all routes via `router.go`:

1. **Recovery** — Catches panics, logs them, returns HTTP 500 with a generic error response. Prevents a single panicking request from crashing the server.
2. **Logging** — Logs method, path, remote address, and request duration for every request.
3. **CORS** — Configured at the HTTP server level via `gorilla/handlers`. Allows origins `localhost:3000` and `127.0.0.1:3000` (the frontend dev server), methods GET/POST/PUT/DELETE, and `Content-Type`/`Authorization` headers.

---

## 11. Server Bootstrap & Wiring

**File:** `internal/server/server.go`

The `Server` struct orchestrates initialization of all components relevant to Screen Mirroring:

```go
type Server struct {
    log            *slog.Logger
    server         *http.Server
    wsManager      *websocket.Manager
    imgService     *images.Service
    spotifyService *spotify.Service
}
```

**Initialization sequence** (`New()`):

```
  1. Create logger (tint-colored slog)
  2. Load server_config.json
  3. Open SQLite database connection
  4. Run AutoMigrate (creates/updates tables)
  5. Create WebSocket Manager
  6. Create Image Service (receives wsManager, imagesPath)
       └── Initial filesystem-database sync runs here
  7. Create HTTP Router (receives wsManager, imgService, db)
       └── Registers /ws, /static/*, /api/v1/* routes
  8. Create HTTP Server with CORS configuration
```

**Runtime startup** (`RunServer()`):

```
  1. go wsManager.Run()           ← Start WS event loop in background
  2. imgService.RunImagesDirWatcher()  ← Start fsnotify watcher in background
  3. server.ListenAndServe()       ← Block on HTTP server (main goroutine)
```

The `RoutingServices` struct is the dependency injection container that carries shared resources to all handlers:

```go
type RoutingServices struct {
    Log            *slog.Logger
    DbConnection   *gorm.DB
    WsManager      *wsService.Manager
    ImageService   *assetsService.Service
    SpotifyService *spotifyService.Service
}
```

---

## 12. Configuration

**File:** `internal/server/server_config.json`

```json
{
  "server_port": "8080",
  "db_path": "dmd.db",
  "assets_path": "public",
  "images_path": "public/images",
  "audios_path": "public/audio",
  "spotify_client_id": "...",
  "spotify_client_secret": "...",
  "spotify_redirect_uri": "http://127.0.0.1:8080/api/v1/auth/spotify/callback"
}
```

Screen Mirroring relevant fields:

| Field | Default | Description |
|-------|---------|-------------|
| `server_port` | `"8080"` | Port the HTTP server listens on. |
| `assets_path` | `"public"` | Root directory for the static file server (mounted at `/static/`). |
| `images_path` | `"public/images"` | Directory monitored by the file watcher and used by the upload handler for saving files. |
| `db_path` | `"dmd.db"` | Path to the SQLite database file. |

If the config file is missing or malformed, the server falls back to `newDefaultConfigs()` with the defaults shown above.

---

## 13. Database & Migrations

**File:** `internal/platform/storage/database.go`

- **Engine:** SQLite via `gorm.io/driver/sqlite`.
- **Connection pool:** 10 idle, 100 max open, 1-hour max lifetime.
- **Auto-migration** runs on every server startup. The Screen Mirroring models migrated are:
  - `images.ImageEntry` → `image_entries` table
  - `images.PresetLayout` → `preset_layouts` table
  - `images.PresetLayoutSlot` → `preset_layout_slots` table

GORM's `AutoMigrate` creates tables if absent and adds missing columns, but does **not** drop columns or change column types. Schema changes that remove or rename columns require manual migration.

---

## 14. How the Frontend Consumes This

The backend serves as the **data layer and notification system** for Screen Mirroring. The expected frontend interaction pattern:

1. **Connect WebSocket:** Both the DM window and the player window establish a WebSocket connection to `ws://localhost:8080/ws` on load. This enables real-time push notifications.

2. **Browse image library:** The DM window calls `GET /api/v1/images/images` (with optional filters) to display the available images. It uses `GET /api/v1/images/types` to populate filter dropdowns.

3. **Upload images:** The DM uploads new images via `POST /api/v1/images/upload`. The file is saved to disk, the directory watcher detects it, syncs with the database, and broadcasts `images_updated` via WebSocket. Both windows receive the event and refresh their image data.

4. **Edit image metadata:** The DM can rename images or change their type via `PUT /api/v1/images/images/{id}`.

5. **Load images:** Both windows fetch actual image files from `http://localhost:8080/static/images/{filename}` for rendering.

6. **Save display presets:** The DM saves a current layout configuration via `POST /api/v1/images/presets` and can list saved presets via `GET /api/v1/images/presets`.

7. **Display coordination:** The actual "show this image to the player" command flow happens over the WebSocket channel, but the **message types and payloads for display commands are defined and handled by the frontend**, not the backend. The backend's WebSocket layer provides the transport; the frontend defines the protocol for display synchronization.

8. **React to changes:** When either window receives an `images_updated` WebSocket event, it re-fetches the image library from the REST API to pick up any changes.

---

## 15. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Filesystem as source of truth for image files** | Images are actual files on disk. The database tracks metadata. The sync process ensures they stay aligned. This allows images to be added or removed outside the application (e.g., manual file copy). |
| **Two-way sync on startup + fsnotify** | Initial sync on boot handles drift that occurred while the server was down. The live watcher handles changes during runtime. Together, they guarantee consistency. |
| **Soft delete with restore** | When a file disappears, the database record is soft-deleted, preserving DM-assigned metadata (name, type, description). If the file returns, the record is restored. This prevents metadata loss from accidental file operations. |
| **Event-driven upload (no direct DB write)** | The upload handler only writes to disk. The file watcher picks it up and creates the DB record. This decouples file ingestion from metadata management and ensures all file arrivals (upload, copy, mount) follow the same code path. |
| **Indiscriminate broadcast** | Every WebSocket event goes to every client. Since DMD is a single-session desktop app where all clients belong to the same DM, room-based routing is unnecessary overhead. |
| **Preset immutability (no PUT)** | Presets can be created and deleted but not updated. The DM creates a new preset for a new configuration. This simplifies the data model and avoids partial-update complexity for nested slot records. |
| **DisplayHandler as placeholder** | The `/display` route is registered but empty. Display state management is deferred — currently handled entirely on the frontend. The stub exists to reserve the endpoint namespace. |
| **BaseHandler default-405 pattern** | Handlers only implement supported methods. Unsupported methods automatically return 405 without boilerplate. |
| **Single ImagesRepository for images + presets** | Both deal with visual assets and share the same database context. Splitting would create two tiny repositories with unnecessary indirection. |
| **Frontend owns display protocol** | The backend broadcasts data-change notifications, but the DM-to-player "show this image" commands are frontend WebSocket messages. This keeps the backend stateless regarding what is currently displayed, simplifying the architecture. |

---

## 16. Test Coverage

Tests exist at both the **handler** and **repository** layers:

| Test File | What It Tests |
|-----------|--------------|
| `handlers/images/images_handlers_test.go` | Image entry creation via POST (status 201, non-zero ID), filtering by type via GET (verifies correct count) |
| `repos/images_repo/images_repo_test.go` | Bulk create (success case with 2 entries), transactional rollback on duplicate `FilePath` constraint violation |
| `routes/router_test.go` | Integration test that the health check route returns 200 (verifies route registration works end-to-end) |

All tests use an **in-memory SQLite database** for isolation:
- Handler tests use `utils.SetupTestEnvironment` which creates a named in-memory DB unique to each test function.
- Repository tests use `common.SetupTestDB` with a shared in-memory DB and table cleanup between sub-tests.

---

## 17. Dependencies

Screen Mirroring relevant dependencies from `go.mod`:

| Package | Version | Role |
|---------|---------|------|
| `github.com/gorilla/mux` | v1.8.1 | HTTP router with path variables and sub-routers |
| `github.com/gorilla/handlers` | v1.5.2 | CORS middleware |
| `github.com/gorilla/websocket` | v1.5.3 | WebSocket upgrade and connection management |
| `github.com/fsnotify/fsnotify` | v1.9.0 | Filesystem event notifications for the directory watcher |
| `gorm.io/gorm` | v1.31.0 | ORM for SQLite (models, queries, migrations, soft delete) |
| `gorm.io/driver/sqlite` | v1.6.0 | SQLite driver for GORM |
| `github.com/lmittmann/tint` | v1.1.2 | Colorized structured logging for slog |
