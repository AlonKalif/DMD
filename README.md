# DMD (Dungeon Master Dashboard)

A full-stack desktop application designed to assist Dungeon Masters in running D&D sessions with a sophisticated dual-window system for controlling and displaying content to players.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Folder Structure](#folder-structure)
6. [Setup & Development](#setup--development)
7. [Build & Deployment](#build--deployment)
8. [Core Development Principles](#core-development-principles)
9. [Backend Architecture](#backend-architecture)
10. [Frontend Architecture](#frontend-architecture)
11. [Data Flow & Communication](#data-flow--communication)
12. [Database Models](#database-models)
13. [API Reference](#api-reference)
14. [Contributing](#contributing)
15. [Roadmap](#roadmap)

---

## Project Overview

**DMD (Dungeon Master Dashboard)** is a desktop application that runs in Google Chrome, providing a dual-window interface where the Dungeon Master controls content in one window while displaying visual elements to players on a second monitor or projector.

### Key Characteristics
- **Target Browser**: Google Chrome (Chromium-based)
- **Languages**: Go (backend), TypeScript (frontend)
- **Deployment**: One-click desktop application
- **Platform Support**: Cross-platform (Linux, Windows, macOS)
- **Architecture**: REST API + WebSocket for real-time sync

---

## Features

### Current Features (Screen Mirroring)
✅ **Dual-Window System**: Separate DM control panel and player display  
✅ **Image Management**: Upload, organize, and filter images by type  
✅ **Layout System**: Single, dual, or quad image layouts  
✅ **Drag & Drop**: Intuitive asset placement  
✅ **Zoom Controls**: Individual zoom per image slot  
✅ **Preset Layouts**: Save and load complete layout configurations  
✅ **Real-Time Sync**: Automatic updates across windows via WebSockets  
✅ **File System Watching**: Auto-detect new images in watched folders  
✅ **BroadcastChannel**: Direct communication between DM and player windows  

### In Development
🚧 **Audio Player**: Background music and sound effects with playlists  

### Planned Features
📋 **Character Management**: Track player characters  
📋 **NPC Database**: Store and manage non-player characters  
📋 **Combat Tracker**: Initiative tracking and HP management  
📋 **Item Database**: Searchable item library  
📋 **Spell Database**: Reference spell details  
📋 **Dice Roller**: Integrated dice rolling with logging  

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Go** | 1.22.2 | Backend language |
| **Gorilla Mux** | 1.8.1 | HTTP routing |
| **Gorilla WebSocket** | 1.5.3 | Real-time communication |
| **GORM** | 1.31.0 | ORM |
| **SQLite** | 3 | Embedded database |
| **fsnotify** | 1.9.0 | File system watcher |
| **slog** | stdlib | Structured logging |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **TypeScript** | 5.5.4 | Type-safe JavaScript |
| **React** | 18.3.1 | UI framework |
| **Redux Toolkit** | 2.2.6 | State management |
| **React Router** | 6.25.1 | Routing |
| **Axios** | 1.7.2 | HTTP client |
| **React DnD** | 16.0.1 | Drag & drop |
| **Tailwind CSS** | 3.4.6 | Styling |
| **Lucide React** | 0.412.0 | Icons |

---

## Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Browser                        │
│  ┌──────────────────┐        ┌──────────────────┐      │
│  │   DM Window      │        │  Player Window   │      │
│  │  (localhost:3000)│◄──────►│ (localhost:3000/ │      │
│  │                  │ Broad- │     player)      │      │
│  │  - Control Panel │ cast   │  - Full Display  │      │
│  │  - Preview       │ Channel│  - No Controls   │      │
│  └────────┬─────────┘        └─────────┬────────┘      │
│           │                             │               │
└───────────┼─────────────────────────────┼───────────────┘
            │                             │
            │          WebSocket          │
            │         HTTP/REST           │
            └────────────┬────────────────┘
                         │
            ┌────────────▼────────────┐
            │   Go Backend Server     │
            │   (localhost:8080)      │
            │                         │
            │  - REST API             │
            │  - WebSocket Manager    │
            │  - File Watcher         │
            │  - Services             │
            └────────────┬────────────┘
                         │
            ┌────────────▼────────────┐
            │   SQLite Database       │
            │   (dmd.db)              │
            └─────────────────────────┘
            ┌────────────────────────┐
            │   File System          │
            │   (public/images)      │
            └────────────────────────┘
```

### Design Patterns

- **Repository Pattern**: Database operations abstracted behind interfaces
- **Handler Pattern**: Each API endpoint has a dedicated handler
- **Service Pattern**: Business logic encapsulated in service layers
- **Middleware Pattern**: Request/response interception
- **Observer Pattern**: WebSocket broadcasts events to clients
- **Pub/Sub Pattern**: File system watcher publishes change events

---

## Folder Structure

### Root Structure
```
DMD/
├── backend/          # Go backend server
├── frontend/         # React frontend app
├── README.md         # This file
└── TODO.txt          # Known issues and tasks
```

### Backend (`/backend`)
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
│   │   │   ├── system/
│   │   │   ├── websocket/
│   │   │   └── baseHandler.go
│   │   ├── middleware/         # Logging, recovery
│   │   └── routes/
│   │       ├── apiRoutes.go    # Route definitions
│   │       └── router.go       # Router initialization
│   ├── model/                  # GORM database models
│   │   ├── audio/
│   │   ├── character/
│   │   ├── combat/
│   │   ├── gameplay/
│   │   ├── images/             # ImageEntry, PresetLayout, PresetLayoutSlot
│   │   └── websocket/
│   ├── platform/
│   │   ├── logger/             # Structured logging
│   │   └── storage/
│   │       ├── repos/          # Repository interfaces + implementations
│   │       ├── connection.go
│   │       └── migrations.go
│   ├── server/
│   │   ├── server.go           # Server initialization
│   │   └── server_config.json  # Configuration
│   └── services/
│       ├── images/             # Image sync + file watcher
│       ├── watcher/            # Generic directory watcher
│       └── websocket/          # WebSocket manager
├── public/
│   ├── images/                 # User uploaded images (watched)
│   └── audio/                  # Audio files
├── dmd.db                      # SQLite database
├── go.mod
└── go.sum
```

### Frontend (`/frontend`)
```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── app/
│   │   ├── hooks.ts            # Typed Redux hooks
│   │   └── store.ts            # Redux store
│   ├── components/
│   │   ├── layout/             # BottomNavBar, etc.
│   │   └── screen-mirroring/   # All screen mirroring components
│   │       ├── AssetPanel.tsx
│   │       ├── AssetSelectionBar.tsx
│   │       ├── DraggableAsset.tsx
│   │       ├── EditAssetModal.tsx
│   │       ├── ImageSlot.tsx
│   │       ├── LayoutSelector.tsx
│   │       ├── PresetItem.tsx
│   │       ├── PresetPanel.tsx
│   │       ├── ScreenMirroringToolbar.tsx
│   │       └── StagingArea.tsx
│   ├── features/               # Redux slices
│   │   ├── audioManager/
│   │   ├── characterManager/
│   │   ├── combatTracker/
│   │   ├── display/            # Player window state
│   │   ├── images/             # Image library state
│   │   └── ui/
│   ├── hooks/
│   │   ├── useBroadcastChannel.ts  # Inter-window communication
│   │   ├── useHorizontalScroll.ts
│   │   └── useWebSocket.ts         # Backend WebSocket
│   ├── layouts/
│   │   └── DmLayout.tsx        # Main layout with WebSocket
│   ├── pages/
│   │   ├── AudioPlayerPage.tsx
│   │   ├── CardsPage.tsx
│   │   ├── PlayerDisplayPage.tsx    # Player display (fullscreen)
│   │   └── ScreenMirroringPage.tsx  # DM control page
│   ├── routes/
│   │   └── AppRouter.tsx       # React Router config
│   ├── services/               # API service functions
│   ├── types/
│   │   └── api.ts              # TypeScript API interfaces
│   ├── config.ts               # API base URL
│   ├── index.tsx               # React entry point
│   └── index.css               # Tailwind imports
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── STYLE_GUIDE.md              # Frontend coding standards
└── README.md
```

---

## Setup & Development

### Prerequisites
- **Go**: 1.22.2 or higher
- **Node.js**: 18+
- **npm**: 8+
- **Chrome**: Latest version

### Backend Setup

1. **Navigate to backend**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   go mod download
   ```

3. **Run server**:
   ```bash
   go run cmd/main.go
   ```
   - Server starts on `localhost:8080`
   - Database auto-migrates on startup
   - Logs appear in console

4. **Optional: Hot reload with Air**:
   ```bash
   # Install Air
   go install github.com/cosmtrek/air@latest
   
   # Run with hot reload
   air
   ```

### Frontend Setup

1. **Navigate to frontend**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run dev server**:
   ```bash
   npm start
   ```
   - Dev server starts on `localhost:3000`
   - Auto-opens in browser
   - Hot module replacement enabled

### Running the Full Application

**Terminal 1 - Backend**:
```bash
cd backend
go run cmd/main.go
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm start
```

**Browser**:
- **DM Window**: `http://localhost:3000`
- **Player Window**: `http://localhost:3000/player` (move to second monitor, press F11)

---

## Build & Deployment

### Recommended Deployment Approach

For a one-click desktop experience, I recommend **Option A** or **Option B**:

#### **Option A: Electron Wrapper** (Recommended)
- Packages backend binary + frontend into native app
- Auto-starts both backend and browser
- True desktop experience (taskbar icon, notifications)
- Cross-platform installers
- **Pros**: Best UX, native features
- **Cons**: Larger file size (~150MB)

#### **Option B: Standalone Executable + Auto-Browser**
- Single Go executable that:
  1. Starts HTTP server
  2. Auto-opens default browser to `localhost:8080`
  3. Serves frontend from embedded files
- **Pros**: Smaller size (~30MB), simpler
- **Cons**: Depends on system browser

#### **Option C: Manual Launch** (Current)
- User runs backend, manually opens browser
- **Pros**: Simple development
- **Cons**: Not user-friendly for non-technical users

### Current Build Process

#### Backend Build

**Windows (from Linux)**:
```bash
cd backend
GOOS=windows GOARCH=amd64 go build -o dmd-server.exe cmd/main.go
```

**Linux**:
```bash
cd backend
go build -o dmd-server cmd/main.go
```

**macOS (from Linux)**:
```bash
cd backend
GOOS=darwin GOARCH=amd64 go build -o dmd-server cmd/main.go
```

#### Frontend Build

```bash
cd frontend
npm run build
```
- Outputs to `frontend/build/`
- Optimized, minified bundles

#### Creating Portable Package

```bash
#!/bin/bash
# Create distribution folder
mkdir -p dist/DMD-Portable
cd dist/DMD-Portable

# Copy backend binary
cp ../../backend/dmd-server(.exe) .

# Copy config
mkdir -p internal/server
cp ../../backend/internal/server/server_config.json internal/server/

# Copy frontend build
mkdir -p public/webapp
cp -r ../../frontend/build/* public/webapp/

# Create empty folders
mkdir -p public/images
mkdir -p public/audio

# Package
cd ..
zip -r DMD-Portable.zip DMD-Portable/
```

**Portable Structure**:
```
DMD-Portable/
├── dmd-server(.exe)
├── internal/server/server_config.json
├── public/
│   ├── images/
│   ├── audio/
│   └── webapp/              # Frontend build
│       ├── index.html
│       └── static/
├── dmd.db                   # Created on first run
└── README.txt
```

### Implementing Auto-Browser Launch (Option B)

To implement auto-browser launch, add to `backend/cmd/main.go`:

```go
package main

import (
    "dmd/backend/internal/server"
    "fmt"
    "os/exec"
    "runtime"
    "time"
)

func main() {
    sm := server.New()
    
    // Start server in goroutine
    go sm.RunServer()
    
    // Wait for server to start
    time.Sleep(2 * time.Second)
    
    // Open browser
    url := "http://localhost:8080/static/webapp/index.html"
    openBrowser(url)
    
    // Block forever
    select {}
}

func openBrowser(url string) error {
    var cmd *exec.Cmd
    
    switch runtime.GOOS {
    case "linux":
        cmd = exec.Command("xdg-open", url)
    case "windows":
        cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
    case "darwin":
        cmd = exec.Command("open", url)
    default:
        return fmt.Errorf("unsupported platform")
    }
    
    return cmd.Start()
}
```

Update `config.ts` to detect production:
```typescript
export const API_BASE_URL = 
    process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:8080';
```

---

## Core Development Principles

### 1. **SOLID Principles**

**Single Responsibility Principle (SRP)**:
- Each handler manages one resource type
- Services have focused responsibilities
- Components render single UI concerns

**Open/Closed Principle (OCP)**:
- Handlers extend `BaseHandler` with default implementations
- Repository interfaces allow implementation swapping
- Redux slices are independent modules

**Liskov Substitution Principle (LSP)**:
- All handlers implement `IHandler` interface
- Repository implementations satisfy contracts

**Interface Segregation Principle (ISP)**:
- Domain-specific repository interfaces
- Components receive only needed props

**Dependency Inversion Principle (DIP)**:
- Handlers depend on repository interfaces
- Services injected via `RoutingServices`
- Redux hooks abstract store access

### 2. **Modularity**
- Domain-driven structure (images, audio, characters)
- Feature-based Redux slices
- Reusable React components

### 3. **Portability**
- Relative paths in configuration
- Embedded database (SQLite)
- Cross-platform file path handling
- Single binary distribution

### 4. **Type Safety**
- Strong typing in Go
- Full TypeScript coverage
- Matching Go structs ↔ TypeScript interfaces

### 5. **Real-Time Synchronization**
- WebSocket broadcasts for backend events
- BroadcastChannel for frontend inter-window sync
- File system watcher for automatic asset detection

### 6. **Error Handling**
- Structured error types
- Comprehensive logging
- Recovery middleware
- User-friendly error messages

### 7. **Testing** (Goal: High Coverage)
- Unit tests for handlers (with mocks)
- Component tests for UI
- Integration tests for critical flows

### 8. **Code Quality**
- ESLint + Prettier (frontend)
- go fmt + go vet (backend)
- Style guide enforcement

---

## Backend Architecture

### Entry Point

```go
// cmd/main.go
func main() {
    sm := server.New()  // Initialize all components
    sm.RunServer()      // Start (blocking)
}
```

### Server Initialization Flow

1. **Logger**: Initialize structured logger (slog)
2. **Configuration**: Load from `server_config.json` (or defaults)
3. **Database**: Connect to SQLite via GORM
4. **Migrations**: Auto-migrate all models
5. **Services**:
   - WebSocket Manager (runs in goroutine)
   - Image Service (file watcher + DB sync)
6. **Router**: Initialize routes with middleware
7. **HTTP Server**: Start with CORS

### Handler Interface

All handlers implement:
```go
type IHandler interface {
    Get(w http.ResponseWriter, r *http.Request)
    Put(w http.ResponseWriter, r *http.Request)
    Post(w http.ResponseWriter, r *http.Request)
    Delete(w http.ResponseWriter, r *http.Request)
    GetPath() string
}
```

### Base Handler Pattern

```go
type BaseHandler struct {
    Path string
}
// Default implementations return 405 Method Not Allowed
// Specific handlers embed BaseHandler and override methods
```

### Example Handler

```go
type ImagesHandler struct {
    handlers.BaseHandler
    repo repos.ImagesRepository
    log  *slog.Logger
}

func (h *ImagesHandler) Get(w http.ResponseWriter, r *http.Request) {
    images, err := h.repo.GetAllImages(filters)
    if err != nil {
        utils.RespondWithError(w, err)
        return
    }
    utils.RespondWithJSON(w, http.StatusOK, images)
}
```

### Routing Services

Handlers receive a `RoutingServices` struct:
```go
type RoutingServices struct {
    Log          *slog.Logger
    DbConnection *gorm.DB
    WsManager    *websocket.Manager
    ImageService *images.Service
}
```

### Repository Pattern

```go
// Interface (in repos/repository.go)
type ImagesRepository interface {
    GetImageByID(id uint) (*images.ImageEntry, error)
    GetAllImages(filters) ([]*images.ImageEntry, error)
    CreateImageEntry(*images.ImageEntry) error
    // ... more methods
}

// Implementation (in repos/images_repo/images_repo.go)
type imagesRepo struct {
    db *gorm.DB
}

func (r *imagesRepo) GetImageByID(id uint) (*images.ImageEntry, error) {
    var img images.ImageEntry
    err := r.db.First(&img, id).Error
    return &img, err
}
```

### Middleware

1. **Recovery**: Catches panics, logs, returns 500
2. **Logging**: Logs every request (method, path, status, duration)

### File Watcher Service

**Purpose**: Monitor `public/images` for file changes

**Flow**:
```
File Added → fsnotify Event → Image Service Handler
    → Sync DB (create/update/delete entries)
    → WebSocket Broadcast {type: "images_updated"}
    → Frontend receives event
    → Redux dispatch(fetchImages())
    → UI updates
```

**Implementation**:
```go
// services/images/image_service.go
func (s *Service) imagesDirEventHandler(event fsnotify.Event) error {
    if event.Has(fsnotify.Create) || event.Has(fsnotify.Remove) {
        s.SyncImageEntriesWithDatabase()
        s.wsManager.Broadcast(websocket.Event{Type: "images_updated"})
    }
    return nil
}
```

---

## Frontend Architecture

### Entry Point

```tsx
// index.tsx
ReactDOM.render(
  <Provider store={store}>      {/* Redux */}
    <BrowserRouter>             {/* React Router */}
      <AppRouter />
    </BrowserRouter>
  </Provider>,
  document.getElementById('root')
);
```

### Routing

```tsx
/                → DmLayout → ScreenMirroringPage
/audio           → DmLayout → AudioPlayerPage
/cards           → DmLayout → CardsPage
/player          → PlayerDisplayPage (standalone)
```

### Redux Store

```typescript
configureStore({
  reducer: {
    ui,          // Modal states, notifications
    combat,      // Combat tracker
    characters,  // Player characters
    npcs,        // NPCs
    audio,       // Audio playback
    display,     // Player window content
    images,      // Image library
  }
})
```

### Component Hierarchy (Screen Mirroring)

```
ScreenMirroringPage
├── ScreenMirroringToolbar (Browse button)
├── AssetPanel (left sidebar)
│   ├── Tab Switcher (Assets / Presets)
│   ├── AssetSelectionBar (Assets tab)
│   │   └── DraggableAsset (each image)
│   └── PresetPanel (Presets tab)
│       └── PresetItem (mini preview)
└── StagingArea (main center)
    ├── LayoutSelector (top-left with Save button)
    └── ImageSlot[] (grid of slots)
        ├── Image preview
        ├── Zoom controls
        └── Clear button
```

### Drag & Drop Flow

```typescript
// DraggableAsset provides drag source
const item = { type: 'ASSET', id: imageId, url: imageUrl };

// ImageSlot accepts drops
const [{ isOver }, drop] = useDrop({
    accept: 'ASSET',
    drop: (item) => onDropAsset(slotId, item),
});

// Parent handles state update
const handleDropAsset = (slotId, item) => {
    setLayoutState(prev => ({
        ...prev,
        slots: prev.slots.map(slot =>
            slot.slotId === slotId
                ? { ...slot, url: item.url, imageId: item.id, zoom: 1 }
                : slot
        )
    }));
};
```

### BroadcastChannel Communication

**DM Window** → Player Window:
```typescript
channel.postMessage({ 
    type: 'show_layout', 
    payload: layoutState 
});
```

**Player Window** listens:
```typescript
channel.onmessage = (event) => {
    if (event.data.type === 'show_layout') {
        dispatch(setCurrentLayout(event.data.payload));
    }
};
```

### WebSocket Integration

```typescript
// DmLayout.tsx
const handleWebSocketMessage = useCallback((message) => {
    if (message.type === 'images_updated') {
        dispatch(fetchImages());  // Re-fetch image library
    }
}, [dispatch]);

useWebSocket(`${API_BASE_URL}/ws`, handleWebSocketMessage);
```

### Styling System

- **Framework**: Tailwind CSS (utility-first)
- **Conditional Classes**: `clsx` library
- **Theme**: Dark mode (gray-900 backgrounds, blue accents)
- **Responsive**: Mobile-first breakpoints

```tsx
<div className={clsx(
    'p-4 rounded-lg',
    isActive && 'bg-blue-500',
    !isActive && 'bg-gray-700'
)}>
```

---

## Data Flow & Communication

### 1. Image Upload Flow

```
User clicks Browse
  ↓
File selected (change event)
  ↓
handleFileUpload: Create FormData
  ↓
POST /api/v1/images/upload (multipart/form-data)
  ↓
Backend: UploadHandler saves to public/images/
  ↓
fsnotify detects new file
  ↓
Image Service: SyncImageEntriesWithDatabase()
  ↓
Create ImageEntry in database
  ↓
WebSocket Broadcast {type: "images_updated"}
  ↓
Frontend WebSocket receives event
  ↓
DmLayout: dispatch(fetchImages())
  ↓
Redux state updates
  ↓
AssetSelectionBar re-renders with new image
```

### 2. Preset Save Flow

```
User stages images in StagingArea
  ↓
User clicks Save Preset button (4th button in LayoutSelector)
  ↓
handleSavePreset: Convert layoutState to PresetLayout JSON
  ↓
POST /api/v1/images/presets
  {
    layout_type: "dual",
    slots: [
      {image_id: 5, slot_id: 0, zoom: 1.2},
      {image_id: 7, slot_id: 1, zoom: 1.0}
    ]
  }
  ↓
Backend: PresetHandler.Post()
  ↓
repo.CreatePreset() - GORM transaction
  ↓
Saves PresetLayout + PresetLayoutSlots with foreign keys
  ↓
Response 201 Created (returns preset with ID)
  ↓
Frontend: Increment presetRefreshKey
  ↓
PresetPanel useEffect triggers (dependency: refreshKey)
  ↓
GET /api/v1/images/presets
  ↓
Response includes full preset with Preload("Slots.Image")
  ↓
New preset appears in Presets tab
```

### 3. Preset Load Flow

```
User switches to Presets tab
  ↓
PresetPanel fetches: GET /api/v1/images/presets
  ↓
Backend: repo.GetAllPresets() with Preload("Slots.Image")
  ↓
Returns: [{ID: 1, layout_type: "dual", slots: [...]}]
  ↓
PresetPanel renders PresetItem for each preset
  ↓
User clicks PresetItem
  ↓
handleLoadPreset(preset)
  ↓
Convert PresetLayout to LayoutState:
  - Create slots array based on layout_type
  - Map preset.slots to state slots (match slot_id)
  - Build image URLs from file_path
  ↓
setLayoutState({layout: "dual", status: "staged", slots: [...]})
  ↓
StagingArea re-renders with preset images and zoom levels
```

### 4. Show to Players Flow

```
User clicks "Show To Players" button
  ↓
BroadcastChannel.postMessage({
    type: 'show_layout',
    payload: layoutState
})
  ↓
Player Window (listening on 'dmd-channel') receives message
  ↓
handleBroadcastMessage: dispatch(setCurrentLayout(payload))
  ↓
Redux display slice updates: currentLayout = payload
  ↓
PlayerDisplayPage re-renders
  ↓
Renders grid with layoutState.layout (single/dual/quad)
  ↓
Maps over layoutState.slots, displays images with zoom
  ↓
Player sees content on projector/second monitor
```

### 5. Asset Drag & Drop Flow

```
User drags DraggableAsset from AssetSelectionBar
  ↓
react-dnd tracks drag with item {type: 'ASSET', id, url}
  ↓
User hovers over ImageSlot
  ↓
ImageSlot shows visual feedback (isOver highlight)
  ↓
User releases mouse (drop)
  ↓
ImageSlot.drop() calls onDropAsset(slotId, item)
  ↓
ScreenMirroringPage.handleDropAsset updates state:
  layoutState.slots[slotId] = {
      slotId,
      url: item.url,
      imageId: item.id,
      zoom: 1
  }
  ↓
StagingArea re-renders
  ↓
ImageSlot now displays image with zoom controls
```

---

## Database Models

### Schema Overview

All models use GORM conventions:
- `ID`: Primary key (uint, auto-increment)
- `CreatedAt`, `UpdatedAt`, `DeletedAt`: Timestamps (soft delete enabled)

### Images Domain

#### ImageEntry
```go
type ImageEntry struct {
    gorm.Model
    Name     string  `gorm:"not null" json:"name"`
    Type     string  `gorm:"not null" json:"type"`  // "map", "character", "monster", etc.
    FilePath string  `gorm:"not null;unique" json:"file_path"`
}
```

**Purpose**: Represents an image file in the database  
**Relationships**: Referenced by `PresetLayoutSlot`

#### PresetLayout
```go
type PresetLayout struct {
    gorm.Model
    LayoutType LayoutType         `gorm:"not null" json:"layout_type"`  // "single", "dual", "quad"
    Slots      []PresetLayoutSlot `gorm:"foreignKey:PresetLayoutID" json:"slots"`
}

type LayoutType string
const (
    Single LayoutType = "single"
    Dual   LayoutType = "dual"
    Quad   LayoutType = "quad"
)
```

**Purpose**: Stores a saved layout configuration  
**Relationships**: Has many `PresetLayoutSlot`

#### PresetLayoutSlot
```go
type PresetLayoutSlot struct {
    gorm.Model
    PresetLayoutID uint       `gorm:"not null" json:"-"`
    ImageID        uint       `gorm:"not null" json:"image_id"`
    SlotID         int        `gorm:"not null" json:"slot_id"`  // Position (0-3)
    Zoom           float64    `gorm:"not null" json:"zoom"`
    Image          ImageEntry `gorm:"foreignKey:ImageID" json:"image"`
}
```

**Purpose**: Represents one image slot within a preset  
**Relationships**: Belongs to `PresetLayout`, references `ImageEntry`

### Database Relationships

```
PresetLayout (1) ──< (N) PresetLayoutSlot
                             │
                             │ (N) >── (1) ImageEntry
```

- **One-to-Many**: One PresetLayout has many PresetLayoutSlots
- **Many-to-One**: Each PresetLayoutSlot references one ImageEntry
- **Cascade Delete**: Deleting PresetLayout deletes associated slots (GORM default)

### Querying with Preload

```go
// Fetch all presets with nested slots and images
var presets []*PresetLayout
db.Preload("Slots.Image").Find(&presets)

// Result:
// [{
//   ID: 1,
//   LayoutType: "dual",
//   Slots: [
//     {ID: 1, SlotID: 0, Zoom: 1.2, Image: {ID: 5, Name: "goblin.png", ...}},
//     {ID: 2, SlotID: 1, Zoom: 1.0, Image: {ID: 7, Name: "knight.jpg", ...}}
//   ]
// }]
```

### Auto-Migration

On server startup:
```go
db.AutoMigrate(
    &images.ImageEntry{},
    &images.PresetLayout{},
    &images.PresetLayoutSlot{},
    // ... other models
)
```

**Behavior**: 
- Creates tables if they don't exist
- Adds new columns if schema changes
- **Does not** remove columns or modify types (safe for production)

---

## API Reference

### Base URL
```
http://localhost:8080/api/v1
```

### Health Check

#### `GET /health`
Check if server is running.

**Response**: `200 OK`
```json
{"status": "ok"}
```

---

### Images

#### `GET /images/images`
Get all images with optional filtering.

**Query Parameters**:
- `type` (optional): Filter by type (e.g., `?type=map`)

**Response**: `200 OK`
```json
[
  {
    "ID": 1,
    "name": "goblin.png",
    "type": "monster",
    "file_path": "public/images/goblin.png",
    "CreatedAt": "2024-01-01T12:00:00Z"
  }
]
```

#### `GET /images/images/{id}`
Get a specific image by ID.

**Response**: `200 OK`
```json
{
  "ID": 1,
  "name": "goblin.png",
  "type": "monster",
  "file_path": "public/images/goblin.png"
}
```

#### `POST /images/upload`
Upload an image file.

**Content-Type**: `multipart/form-data`

**Body**:
- `file`: Image file (jpeg, png, gif, webp)

**Response**: `201 Created`
```json
{
  "message": "File uploaded successfully",
  "filename": "goblin.png"
}
```

**Validation**:
- Max file size: 10MB
- Allowed types: image/jpeg, image/png, image/gif, image/webp
- Duplicate filenames auto-renamed (e.g., `image.jpg` → `image_1.jpg`)

#### `GET /images/types`
Get all unique image types.

**Response**: `200 OK`
```json
["map", "character", "monster", "item"]
```

#### `PUT /images/images/{id}`
Update image metadata (not the file itself).

**Body**:
```json
{
  "name": "red_dragon.png",
  "type": "monster"
}
```

**Response**: `200 OK`

#### `DELETE /images/images/{id}`
Delete an image entry from database.

**Response**: `204 No Content`

**Note**: Does not delete the actual file (manual cleanup required).

---

### Presets

#### `GET /images/presets`
Get all saved presets with full data.

**Response**: `200 OK`
```json
[
  {
    "ID": 1,
    "layout_type": "dual",
    "CreatedAt": "2024-01-01T12:00:00Z",
    "slots": [
      {
        "ID": 1,
        "image_id": 5,
        "slot_id": 0,
        "zoom": 1.2,
        "image": {
          "ID": 5,
          "name": "goblin.png",
          "type": "monster",
          "file_path": "public/images/goblin.png"
        }
      },
      {
        "ID": 2,
        "image_id": 7,
        "slot_id": 1,
        "zoom": 1.0,
        "image": {
          "ID": 7,
          "name": "knight.jpg",
          "type": "character",
          "file_path": "public/images/knight.jpg"
        }
      }
    ]
  }
]
```

#### `POST /images/presets`
Create a new preset.

**Body**:
```json
{
  "layout_type": "dual",
  "slots": [
    {"image_id": 5, "slot_id": 0, "zoom": 1.2},
    {"image_id": 7, "slot_id": 1, "zoom": 1.0}
  ]
}
```

**Response**: `201 Created`
```json
{
  "ID": 1,
  "layout_type": "dual",
  "slots": [...]
}
```

**Validation**:
- `layout_type` must be "single", "dual", or "quad"
- At least one slot required
- `image_id` must reference existing ImageEntry

#### `DELETE /images/presets/{id}`
Delete a preset.

**Response**: `204 No Content`

**Side Effects**: Cascade deletes all associated PresetLayoutSlots.

---

### Display (Planned)

#### `GET /display`
Get current player display state.

#### `POST /display`
Set player display content.

#### `DELETE /display`
Clear player display.

---

### WebSocket

#### `ws://localhost:8080/ws`
WebSocket connection for real-time events.

**Server → Client Events**:
```json
{"type": "images_updated"}
{"type": "new_chat_message", "payload": {...}}
```

**Client → Server Messages** (currently unused):
```json
{"type": "send_message", "payload": {...}}
```

---

### Static Files

#### `GET /static/*`
Serve static files from `public/` directory.

**Examples**:
- `/static/images/goblin.png` → serves `public/images/goblin.png`
- `/static/webapp/index.html` → serves frontend (production build)

---

### Error Responses

All errors follow this format:

**400 Bad Request**:
```json
{
  "error": "Invalid request body",
  "details": "missing required field: layout_type"
}
```

**404 Not Found**:
```json
{
  "error": "Resource not found",
  "details": "preset with ID 999 does not exist"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Internal server error",
  "details": "database connection failed"
}
```

---

## Contributing

### Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/DMD.git
   cd DMD
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make changes and test**
5. **Commit with descriptive messages**:
   ```bash
   git commit -m "Add preset deletion confirmation modal"
   ```
6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request**

### Code Style

**Frontend**:
- Follow `frontend/STYLE_GUIDE.md`
- Run `npm run format` before committing
- Run `npm run lint` to check for issues
- Use TypeScript (no `any` types)

**Backend**:
- Run `go fmt ./...` before committing
- Run `go vet ./...` to check for issues
- Follow Go best practices (effective Go)
- Add godoc comments to exported functions

### Testing

**Backend**:
```bash
cd backend
go test ./... -v
```

**Frontend**:
```bash
cd frontend
npm test
```

### Pull Request Guidelines

- **Title**: Clear, concise description
- **Description**: Explain what and why
- **Tests**: Include tests for new features
- **Documentation**: Update README if needed
- **Breaking Changes**: Clearly marked
- **Screenshots**: For UI changes

---

## Roadmap

### Phase 1: Screen Mirroring (Complete ✅)
- [x] Dual-window architecture
- [x] Image upload and management
- [x] Drag & drop interface
- [x] Layout system (single/dual/quad)
- [x] Preset save/load
- [x] Real-time synchronization
- [x] File system watcher

### Phase 2: Audio Player (In Progress 🚧)
- [ ] Audio file upload
- [ ] Playlist management
- [ ] Playback controls
- [ ] Volume controls
- [ ] Background music loop
- [ ] Sound effects trigger

### Phase 3: Combat Tracker
- [ ] Initiative tracking
- [ ] HP management
- [ ] Conditions/status effects
- [ ] Turn order display
- [ ] Quick dice roller
- [ ] Combat log

### Phase 4: Character Management
- [ ] Player character database
- [ ] Character sheets
- [ ] HP/status tracking
- [ ] Inventory management
- [ ] Spell slots
- [ ] Level up tracking

### Phase 5: NPC & Monster Database
- [ ] NPC catalog
- [ ] Monster stats
- [ ] Search and filter
- [ ] Quick stat blocks
- [ ] Custom entries

### Phase 6: Advanced Features
- [ ] Map tools (drawing, tokens)
- [ ] Dice roller with formulas
- [ ] DM notes
- [ ] Session logging
- [ ] Campaign management
- [ ] Cloud backup/sync

### Phase 7: Polish & Distribution
- [ ] Electron wrapper
- [ ] Installers (Windows, Linux, macOS)
- [ ] Auto-updater
- [ ] User documentation
- [ ] Video tutorials
- [ ] Community features

---

## Known Issues

See `TODO.txt` for current bugs and tasks.

**High Priority**:
1. Nav bar overlaps with content
2. Scrolling required (should fit viewport)
3. Scrollbar styling needs improvement

**Fixed**:
- ~~Browse button non-functional~~ ✅
- ~~Preset button cut-off~~ ✅

---

## License

[Specify license - MIT, Apache 2.0, etc.]

---

## Contact & Support

- **Developer**: Alon K.
- **Repository**: [GitHub URL]
- **Issues**: [GitHub Issues URL]
- **Discussions**: [GitHub Discussions URL]

---

## Acknowledgments

- Built with Go and React
- Icons by [Lucide](https://lucide.dev/)
- Inspired by D&D Beyond and Roll20

---

**Happy Dungeon Mastering! 🎲⚔️🐉**

