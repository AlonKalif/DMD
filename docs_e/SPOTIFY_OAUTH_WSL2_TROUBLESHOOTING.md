# Spotify OAuth Integration - WSL2 Troubleshooting Summary

## Overview

This document details the issues encountered and solutions implemented when integrating Spotify OAuth authentication in a WSL2 development environment with Chrome running on Windows host.

---

## Issue #1: "Connection Refused" Error

### Problem Description

When clicking the "Connect with Spotify" button in the Audio Player page, a popup window opened with the error:

```
This site can't be reached
127.0.0.1 refused to connect.
```

### Initial Investigation

**What We Checked:**
1. Backend server status - ✅ Running on port 8080
2. Spotify auth endpoints existence - ✅ Registered correctly
3. Backend logs - ✅ Showed requests to `/api/v1/auth/spotify/status` succeeding

**Key Discovery:**
- `curl http://127.0.0.1:8080/api/v1/auth/spotify/status` from WSL2 terminal: ✅ Worked
- `curl http://127.0.0.1:8080/api/v1/auth/spotify/login` from WSL2 terminal: ✅ Worked
- Chrome (Windows) accessing same URL: ❌ Failed

### Root Cause

**Network Isolation Between WSL2 and Windows:**
- Backend server runs **inside WSL2** Linux environment
- Chrome browser runs on **Windows host** operating system
- `127.0.0.1` in WSL2 ≠ `127.0.0.1` in Windows
- They are separate network stacks

**Evidence from Backend Logs:**
```
19:25:40 INF Request handled method=GET path=/api/v1/auth/spotify/status remote_addr=[::1]:49202
```
All requests showed `remote_addr=[::1]` (IPv6 localhost from within WSL2), confirming the frontend React dev server (which uses WSLg networking) could reach the backend, but direct browser navigation could not.

### Initial Solution Attempt: Using WSL2 IP Address

**Approach:**
1. Found WSL2 IP address: `hostname -I` → `172.18.31.33`
2. Tested direct access: `http://172.18.31.33:8080/api/v1/auth/spotify/login` ✅ Worked in Chrome
3. Updated configurations to use WSL2 IP

**Implementation:**

Created environment-based configuration system:

**Frontend (`frontend/.env.local`):**
```env
REACT_APP_API_BASE_URL=http://172.18.31.33:8080
REACT_APP_SPOTIFY_AUTH_URL=http://172.18.31.33:8080
```

**Frontend (`frontend/src/config.ts`):**
```typescript
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
export const SPOTIFY_AUTH_URL = process.env.REACT_APP_SPOTIFY_AUTH_URL || 'http://127.0.0.1:8080';
```

**Backend (`backend/internal/server/server_config.json`):**
```json
{
  "spotify_redirect_uri": "http://172.18.31.33:8080/api/v1/auth/spotify/callback"
}
```

**Backend Code Changes:**
- Updated `ServerConfig` struct to include `SpotifyRedirectURI` field
- Modified `initSpotifyService()` to accept `redirectURI` parameter
- Updated `spotify.Service` to use configurable redirect URI instead of hardcoded constant

**Result:** ✅ Browser could now connect to backend

---

## Issue #2: "INVALID_CLIENT: Insecure redirect URI"

### Problem Description

After updating Spotify Dashboard with the WSL2 redirect URI and restarting servers, the OAuth flow failed with:

```
INVALID_CLIENT: Insecure redirect URI
```

**Request Payload:**
```
client_id: 09818e24c9ed487b89e4e9916ae35513
redirect_uri: http://172.18.31.33:8080/api/v1/auth/spotify/callback
response_type: code
scope: user-read-private user-read-playback-state user-modify-playback-state streaming playlist-read-private playlist-read-collaborative
state: 6OBQqaAvtGK5_nCQsSwPFz0-l3OQMpVvPtTB4gSa8zk=
```

### Root Cause

**Spotify OAuth Security Policy:**
- Spotify **only allows HTTP redirect URIs** for `localhost` or `127.0.0.1`
- Any other IP address (including private IPs like `172.18.31.33`) is rejected as "insecure"
- To use other IPs/domains, you **must use HTTPS** with a valid SSL certificate

**Why This Policy Exists:**
- `localhost`/`127.0.0.1` are guaranteed to be local machine only
- Other IPs could potentially be exposed to network attacks
- Prevents OAuth tokens from being sent over unencrypted connections on networks

### Solution: Windows Port Forwarding

**Approach:**
Instead of making the backend accessible via WSL2 IP, we forward Windows `127.0.0.1:8080` → WSL2 `172.18.31.33:8080`.

This way:
- Chrome (Windows) connects to `127.0.0.1:8080`
- Windows OS forwards the traffic to WSL2 backend
- Spotify OAuth sees `127.0.0.1` ✅ (allowed)

### Implementation

**1. Reverted Configs to Use `127.0.0.1`:**

**Frontend (`frontend/.env.local`):**
```env
REACT_APP_API_BASE_URL=http://127.0.0.1:8080
REACT_APP_SPOTIFY_AUTH_URL=http://127.0.0.1:8080
```

**Backend (`backend/internal/server/server_config.json`):**
```json
{
  "spotify_redirect_uri": "http://127.0.0.1:8080/api/v1/auth/spotify/callback"
}
```

**2. Set Up Windows Port Forwarding:**

**PowerShell Command (as Administrator):**
```powershell
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=127.0.0.1 connectport=8080 connectaddress=172.18.31.33
```

**Verification:**
```powershell
netsh interface portproxy show all
```

Expected output:
```
Listen on ipv4:             Connect to ipv4:
Address         Port        Address         Port
--------------- ----------  --------------- ----------
127.0.0.1       8080        172.18.31.33    8080
```

**3. Updated Spotify Dashboard:**
- Kept only: `http://127.0.0.1:8080/api/v1/auth/spotify/callback`
- Removed: `http://172.18.31.33:8080/api/v1/auth/spotify/callback`

### Result

✅ **Spotify OAuth now works completely:**
1. User clicks "Connect with Spotify"
2. Popup opens to `http://127.0.0.1:8080/api/v1/auth/spotify/login`
3. Chrome sends request to Windows `127.0.0.1:8080`
4. Windows forwards → WSL2 `172.18.31.33:8080`
5. Backend redirects to Spotify OAuth
6. User authorizes
7. Spotify redirects to `http://127.0.0.1:8080/api/v1/auth/spotify/callback`
8. Windows forwards → WSL2 backend
9. Backend exchanges code for token
10. Token stored in database
11. Popup closes, frontend updates state

---

## Final Architecture

### Development Environment (WSL2 + Windows)

```
┌─────────────────────────────────────────────────────────────┐
│                        Windows Host                          │
│                                                              │
│  ┌──────────────────┐          ┌──────────────────┐        │
│  │  Chrome Browser  │          │  Port Forwarding │        │
│  │                  │─────────▶│  127.0.0.1:8080  │        │
│  │  localhost:3000  │          │        │         │        │
│  └──────────────────┘          └────────┼─────────┘        │
│                                          │                   │
│                                          ▼                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              WSL2 Linux Instance                     │   │
│  │                                                       │   │
│  │  ┌──────────────────┐    ┌──────────────────┐      │   │
│  │  │  React Dev Server│    │   Go Backend     │      │   │
│  │  │   localhost:3000 │    │ 172.18.31.33:8080│◀─────┼───┘
│  │  └──────────────────┘    └──────────────────┘      │
│  │                                                       │
│  └─────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘

        ▲                              │
        │                              │
        └──────────────────────────────┘
           Spotify OAuth Flow
       (sees 127.0.0.1 redirect URI)
```

### Production Environment (Any OS)

```
┌─────────────────────────────────────────┐
│           Single Operating System        │
│                                          │
│  ┌──────────────┐   ┌──────────────┐   │
│  │   Browser    │   │  Go Backend  │   │
│  │              │──▶│              │   │
│  │ 127.0.0.1    │   │ 127.0.0.1    │   │
│  └──────────────┘   └──────────────┘   │
│                                          │
└─────────────────────────────────────────┘
            ▲            │
            │            │
            └────────────┘
         Spotify OAuth Flow
```

---

## Security: Credentials Management

**⚠️ Important:** Spotify API credentials must **never** be committed to version control.

### Files in `.gitignore`:
- `backend/internal/server/server_config.json` - Contains actual credentials (ignored)
- `frontend/.env.local` - Contains local dev overrides (ignored)

### Files committed to git:
- `backend/internal/server/server_config.example.json` - Template without credentials
- `frontend/.env` - Default values (no secrets)
- `frontend/.env.production` - Production values (no secrets)

### First-time setup:
```bash
cd backend/internal/server
cp server_config.example.json server_config.json
# Edit server_config.json and add your Spotify credentials
```

## Configuration Files Created/Modified

### 1. Frontend Environment Files

**`.env`** (Default, committed to git):
```env
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_SPOTIFY_AUTH_URL=http://127.0.0.1:8080
```

**`.env.local`** (WSL2 override, gitignored):
```env
REACT_APP_API_BASE_URL=http://127.0.0.1:8080
REACT_APP_SPOTIFY_AUTH_URL=http://127.0.0.1:8080
```

**`.env.production`** (Production builds, committed):
```env
REACT_APP_API_BASE_URL=http://127.0.0.1:8080
REACT_APP_SPOTIFY_AUTH_URL=http://127.0.0.1:8080
```

**`.gitignore`** (Created):
```gitignore
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### 2. Backend Configuration

**`server_config.json`** (Active config):
```json
{
  "server_port": "8080",
  "db_path": "dmd.db",
  "assets_path": "public",
  "images_path": "public/images",
  "audios_path": "public/audio",
  "spotify_client_id": "09818e24c9ed487b89e4e9916ae35513",
  "spotify_client_secret": "d77b633134b541eb9d65b70fc7026785",
  "spotify_redirect_uri": "http://127.0.0.1:8080/api/v1/auth/spotify/callback"
}
```

**`server_config.example.json`** (Template, committed):
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

### 3. Code Changes

**`frontend/src/config.ts`:**
```typescript
// Before:
export const API_BASE_URL = 'http://localhost:8080';
export const SPOTIFY_AUTH_URL = 'http://127.0.0.1:8080';

// After:
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
export const SPOTIFY_AUTH_URL = process.env.REACT_APP_SPOTIFY_AUTH_URL || 'http://127.0.0.1:8080';
```

**`backend/internal/server/server.go`:**
- Added `SpotifyRedirectURI` field to `ServerConfig` struct
- Updated `newDefaultConfigs()` to include default redirect URI
- Modified `initSpotifyService()` signature to accept `redirectURI` parameter

**`backend/internal/services/spotify/spotify_service.go`:**
- Removed hardcoded `redirectURI` constant
- Added `redirectURI` field to `Service` struct
- Updated `NewService()` to accept and store `redirectURI` parameter

### 4. Documentation

**`DEVELOPMENT.md`** (Created):
- Full setup instructions for standard and WSL2 environments
- Port forwarding configuration steps
- Troubleshooting guide
- Environment variable documentation

---

## Key Learnings

### 1. WSL2 Networking Behavior
- WSL2 uses virtualization, creating separate network namespace
- `127.0.0.1` in WSL2 ≠ `127.0.0.1` in Windows
- React dev server works across the boundary due to WSLg/webpack dev server magic
- Custom Go servers need explicit configuration

### 2. Spotify OAuth Security
- HTTP redirect URIs only allowed for `localhost`/`127.0.0.1`
- Other IPs require HTTPS with valid certificates
- This is a security feature, not a bug
- Cannot be bypassed or configured in Spotify Dashboard

### 3. Windows Port Forwarding
- `netsh interface portproxy` provides persistent port forwarding
- Survives Windows restarts
- Allows transparent bridging between Windows and WSL2
- Must be configured as Administrator

### 4. Environment-Based Configuration
- Environment variables provide flexibility without code changes
- `.env.local` (gitignored) allows per-developer customization
- `.env.production` ensures correct production builds
- Fallback values in code prevent missing config errors

### 5. Portability Considerations
- WSL2 port forwarding is **development-only** concern
- Production builds work identically on all platforms
- Configuration system supports both scenarios without code changes
- Documentation critical for onboarding new developers

---

## Maintenance Notes

### When WSL2 IP Changes

If you restart Windows or WSL2 and the IP changes, you'll need to update port forwarding:

```powershell
# Check current WSL2 IP
wsl hostname -I

# Remove old forwarding
netsh interface portproxy delete v4tov4 listenport=8080 listenaddress=127.0.0.1

# Add new forwarding with updated IP
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=127.0.0.1 connectport=8080 connectaddress=NEW_IP
```

### Adding More Ports

If you need to forward additional ports (e.g., for debugging tools):

```powershell
netsh interface portproxy add v4tov4 listenport=PORT listenaddress=127.0.0.1 connectport=PORT connectaddress=WSL2_IP
```

### Removing Port Forwarding

If you no longer need port forwarding:

```powershell
netsh interface portproxy delete v4tov4 listenport=8080 listenaddress=127.0.0.1
```

---

## Alternative Solutions Considered

### 1. ❌ Using WSL2 IP Directly
- **Problem**: Spotify rejects non-localhost HTTP URIs
- **Verdict**: Not viable due to Spotify security policy

### 2. ❌ Setting Up HTTPS in Development
- **Problem**: Requires SSL certificates, complex configuration
- **Overhead**: Self-signed certs cause browser warnings
- **Verdict**: Too complex for development environment

### 3. ❌ Running Chrome Inside WSL2
- **Requires**: WSLg (Windows 11+ only)
- **Issues**: Performance overhead, clipboard sync issues
- **Verdict**: Works but suboptimal UX

### 4. ✅ Windows Port Forwarding (Selected)
- **Pros**: Transparent, persistent, no code changes
- **Cons**: Requires one-time Windows configuration
- **Verdict**: Best balance of simplicity and functionality

---

## Testing Checklist

After setup, verify:

- [ ] Backend starts without errors
- [ ] Frontend loads at `http://localhost:3000`
- [ ] Can navigate to Audio Player page
- [ ] "Connect with Spotify" button appears
- [ ] Clicking button opens popup (not new tab)
- [ ] Popup redirects to Spotify login
- [ ] After login, popup closes automatically
- [ ] "Connected to Spotify!" message appears
- [ ] Page refresh maintains connected state
- [ ] Backend logs show successful token storage

---

## Summary

**Problem**: OAuth popup couldn't reach backend due to WSL2 network isolation and Spotify security policy.

**Solution**: Windows port forwarding bridges the gap while maintaining Spotify-compatible `127.0.0.1` URIs.

**Result**: 
- ✅ Functional OAuth in WSL2 development
- ✅ Portable configuration system
- ✅ Production-ready defaults
- ✅ Fully documented setup process

**Time Investment**: ~2 hours of debugging, ~30 minutes one-time Windows configuration

**Future Benefit**: Any developer can set up the environment in <5 minutes using documentation.

