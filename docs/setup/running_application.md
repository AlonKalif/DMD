## Running the Full Application

### Quick Start

You need **two terminal windows** running simultaneously:

#### Terminal 1: Backend Server

```bash
cd backend
go run cmd/main.go
```

Wait for: `HTTP server listening on :8080`

#### Terminal 2: Frontend Dev Server

```bash
cd frontend
npm start
```

Browser opens automatically to `http://localhost:3000`

### Opening Windows

Once both servers are running:

1. **DM Window** (Control Interface):
   - URL: `http://localhost:3000`
   - Use this window to control content, upload images, manage playlists
   - Keep this on your primary monitor

2. **Player Window** (Display for Players):
   - URL: `http://localhost:3000/player`
   - Move to second monitor or projector
   - Press **F11** for fullscreen
   - This shows what players see (no controls)

### Dual Window Setup

**Recommended workflow:**

1. Start backend and frontend servers
2. Open Chrome
3. Navigate to `http://localhost:3000` (DM Window)
4. Open new tab → `http://localhost:3000/player` (Player Window)
5. Drag Player Window to second monitor
6. Press F11 on Player Window for fullscreen
7. Use DM Window to control what players see

### Communication Between Windows

- **BroadcastChannel**: Browser-to-browser communication (instant updates)
- **WebSocket**: Backend pushes updates (file changes, data updates)
- Both windows stay synchronized automatically

### Stopping the Application

**Graceful shutdown:**

1. In frontend terminal: Press `Ctrl+C`
2. In backend terminal: Press `Ctrl+C`

**Force stop (if unresponsive):**
- Linux/Mac: `Ctrl+C` then `kill -9 <PID>`
- Windows: `Ctrl+C` then Task Manager

### Development Workflow

**Typical development session:**

1. Start backend (Terminal 1)
2. Start frontend (Terminal 2)
3. Make code changes
4. Frontend: Changes auto-reload in browser
5. Backend: Restart manually or use Air for hot reload

**With Air (backend hot reload):**
```bash
# Terminal 1
cd backend
air

# Terminal 2
cd frontend
npm start
```

Now both frontend and backend auto-reload on changes!
