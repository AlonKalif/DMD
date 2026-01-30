## Configuration (First-Time Setup)

### Backend Configuration

**⚠️ Important:** The backend requires Spotify API credentials that are **not included in the repository** for security reasons.

#### 1. Create Configuration File

```bash
cd backend/internal/server
cp server_config.example.json server_config.json
```

#### 2. Get Spotify Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in app details:
   - **App name**: DMD (or any name)
   - **App description**: Dungeon Master Dashboard
   - **Redirect URI**: `http://127.0.0.1:8080/api/v1/auth/spotify/callback`
5. Copy your **Client ID** and **Client Secret**

#### 3. Configure server_config.json

Edit `backend/internal/server/server_config.json`:

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

Replace `YOUR_SPOTIFY_CLIENT_ID` and `YOUR_SPOTIFY_CLIENT_SECRET` with your actual credentials.

#### 4. Security Notes

- `server_config.json` is in `.gitignore` and will **never be committed**
- Always use `server_config.example.json` as the template
- Never share your credentials publicly
- If credentials are compromised, regenerate them in Spotify Dashboard

### Frontend Configuration

The frontend uses environment variables for API configuration:

- **`.env`**: Default development values (uses `localhost`)
- **`.env.local`**: Local overrides (gitignored, for WSL2 users)
- **`.env.production`**: Production build values (uses `127.0.0.1`)

For most users, the default `.env` file works without changes.

**WSL2 Users**: See [WSL2 Setup Guide](./wsl2_setup.md) for special configuration.
