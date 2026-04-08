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
            │  - REST API Handlers    │
            │  - WebSocket Manager    │
            │  - Image Service        │
            │  - Spotify Service      │◄────────► Spotify Web API
            │  - File Watcher         │           (OAuth + Playback)
            │  - Middleware           │
            └────────────┬────────────┘
                         │
            ┌────────────▼────────────┐
            │   SQLite Database       │
            │   (dmd.db)              │
            │                         │
            │  - Images               │
            │  - Presets              │
            │  - Characters/NPCs      │
            │  - Combat/Items/Spells  │
            │  - Playlists/Tracks     │
            │  - Spotify Tokens       │
            └─────────────────────────┘
            
            ┌────────────────────────┐
            │   File System          │
            │                        │
            │  - public/images/      │ ◄─── Watched by fsnotify
            │  - public/audio/       │
            │  - public/webapp/      │      (production build)
            └────────────────────────┘
```