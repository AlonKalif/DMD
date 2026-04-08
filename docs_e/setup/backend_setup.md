## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
go mod download
```

This downloads all required Go modules defined in `go.mod`.

### 3. Run the Backend Server

#### Standard Run

```bash
go run cmd/main.go
```

**What happens:**
- Server starts on `localhost:8080`
- Database auto-migrates on startup (creates tables if needed)
- Logs appear in console with colored output
- File watcher starts monitoring `public/images/`

#### With Hot Reload (Air)

For automatic restart on code changes:

```bash
# First time: Install Air
go install github.com/cosmtrek/air@latest

# Run with hot reload
air
```

Air watches for `.go` file changes and automatically rebuilds/restarts the server.

### 4. Verify Backend is Running

Open a browser or use curl:

```bash
curl http://localhost:8080/health
```

Expected response:
```json
{"status": "ok"}
```

### Backend Startup Logs

You should see output similar to:

```
[INFO] Starting DMD Backend Server...
[INFO] Connecting to database: dmd.db
[INFO] Running database migrations...
[INFO] Starting WebSocket Manager
[INFO] Starting Image File Watcher: public/images
[INFO] HTTP server listening on :8080
```

### Troubleshooting

If you encounter errors, see [Backend Troubleshooting](../troubleshooting/backend.md)
