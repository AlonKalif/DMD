# Development Guide

## Running the Application

### Prerequisites
- Go 1.21+
- Node.js 18+
- npm or yarn

### First-Time Setup

#### 1. Configure Backend Credentials

The backend requires Spotify API credentials. These are **not committed to git** for security.

**Create your config file:**
```bash
cd backend/internal/server
cp server_config.example.json server_config.json
```

**Edit `server_config.json` and add your Spotify credentials:**
```json
{
  "spotify_client_id": "YOUR_SPOTIFY_CLIENT_ID",
  "spotify_client_secret": "YOUR_SPOTIFY_CLIENT_SECRET",
  "spotify_redirect_uri": "http://127.0.0.1:8080/api/v1/auth/spotify/callback"
}
```

Get your credentials from: https://developer.spotify.com/dashboard

**⚠️ Security Note:** `server_config.json` is in `.gitignore` and will never be committed. Always use `server_config.example.json` as the template.

### Standard Setup (Native Linux, Mac, or Windows)

1. **Backend Setup**:
   ```bash
   cd backend
   go run cmd/main.go
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. Open Chrome and navigate to `http://localhost:3000`

### WSL2 + Windows Chrome Setup

When developing in WSL2 but using Chrome on Windows host, port forwarding is needed because:
- The Go backend runs inside WSL2
- Chrome runs on Windows host
- Spotify OAuth only allows `localhost`/`127.0.0.1` for HTTP (not WSL2 IPs)

#### Setup Windows Port Forwarding

**One-time setup** - Run in PowerShell as Administrator on Windows:

```powershell
# Find your WSL2 IP first
wsl hostname -I

# Set up port forwarding (replace 172.18.31.33 with your WSL2 IP)
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=127.0.0.1 connectport=8080 connectaddress=172.18.31.33
```

This forwards Windows `127.0.0.1:8080` → WSL2 `172.18.31.33:8080`.

#### Verify Port Forwarding

```powershell
# List all port forwards
netsh interface portproxy show all
```

#### After WSL2 Restarts

If your WSL2 IP changes (after Windows restart), update the port forwarding:

```powershell
# Remove old forwarding
netsh interface portproxy delete v4tov4 listenport=8080 listenaddress=127.0.0.1

# Add new forwarding with updated IP
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=127.0.0.1 connectport=8080 connectaddress=NEW_WSL2_IP
```

#### Alternative: Run Chrome Inside WSL2

If you have WSLg (Windows 11+), you can run Chrome inside WSL2:

```bash
# Install Chrome in WSL2
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install ./google-chrome-stable_current_amd64.deb

# Run Chrome (will open in Windows via WSLg)
google-chrome http://localhost:3000
```

This way, both Chrome and the backend are in WSL2, so `localhost` works naturally.

#### Important Notes:
- **Port forwarding is Windows host configuration**, not project code
- **WSL2 IP can change** after system restart
- **Production builds always use `127.0.0.1`** and don't need port forwarding
- The `frontend/.env.local` uses `127.0.0.1` when port forwarding is configured

## Building for Production

Production builds use `127.0.0.1` and will work correctly on any OS:

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
go build -o dmd-server cmd/main.go
```

The production config uses values from:
- Frontend: `.env.production` (uses `127.0.0.1`)
- Backend: `server_config.json` default redirect URI

## Environment Configuration Files

### Frontend

- `.env` - Default development values (committed)
- `.env.local` - Local overrides for WSL2 (gitignored, not committed)
- `.env.production` - Production build values (committed)

Priority: `.env.local` > `.env`

### Backend

- `backend/internal/server/server_config.json` - Active configuration
- `backend/internal/server/server_config.example.json` - Template for new setups

The `server_config.json` can be customized per environment.

## Troubleshooting

For comprehensive troubleshooting guides, see:
- [Troubleshooting Documentation](docs/troubleshooting/README.md)
- [WSL2 Connection Issues](docs/troubleshooting/wsl2/connection_issues.md)
- [Spotify OAuth Errors](docs/troubleshooting/spotify/oauth_errors.md)
- [Complete WSL2 Spotify OAuth Guide](docs/SPOTIFY_OAUTH_WSL2_TROUBLESHOOTING.md)

