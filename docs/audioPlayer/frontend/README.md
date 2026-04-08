# Audio Player — Frontend Documentation

## Table of Contents

- [1. Feature Overview](#1-feature-overview)
- [2. Architecture Summary](#2-architecture-summary)
- [3. Directory Map](#3-directory-map)
- [4. Component Tree & Data Flow](#4-component-tree--data-flow)
- [5. Page: AudioPlayerPage](#5-page-audioplayerpage)
- [6. Components](#6-components)
  - [6.1 SpotifyLoginButton](#61-spotifyloginbutton)
  - [6.2 SpotifyPlayer](#62-spotifyplayer)
  - [6.3 PlaylistPanel](#63-playlistpanel)
- [7. State Management (Redux)](#7-state-management-redux)
  - [7.1 spotifySlice](#71-spotifyslice)
  - [7.2 audioSlice](#72-audioslice)
  - [7.3 Async Thunks](#73-async-thunks)
  - [7.4 Synchronous Actions](#74-synchronous-actions)
- [8. Spotify Web Playback SDK Integration](#8-spotify-web-playback-sdk-integration)
  - [8.1 SDK Loading](#81-sdk-loading)
  - [8.2 useSpotifyPlayer Hook](#82-usespotifyplayer-hook)
  - [8.3 Singleton Player Pattern](#83-singleton-player-pattern)
  - [8.4 SDK Event Listeners](#84-sdk-event-listeners)
- [9. Authentication Flow (Frontend Perspective)](#9-authentication-flow-frontend-perspective)
  - [9.1 Login Popup Flow](#91-login-popup-flow)
  - [9.2 Auth Pre-warming in DmLayout](#92-auth-pre-warming-in-dmlayout)
  - [9.3 Token Lifecycle](#93-token-lifecycle)
- [10. Playback Flow](#10-playback-flow)
- [11. Type System](#11-type-system)
  - [11.1 Spotify SDK Type Declarations](#111-spotify-sdk-type-declarations)
  - [11.2 Redux State Types](#112-redux-state-types)
- [12. Routing & Navigation](#12-routing--navigation)
- [13. Styling & UI Theme](#13-styling--ui-theme)
- [14. Configuration](#14-configuration)
- [15. Key Design Decisions](#15-key-design-decisions)
- [16. Dependencies](#16-dependencies)

---

## 1. Feature Overview

The Audio Player frontend provides an in-app Spotify music player for D&D sessions. It allows the Dungeon Master to:

- **Authenticate** with their Spotify account via an OAuth popup flow.
- **Browse** their Spotify playlists with cover art, names, and track counts.
- **Explore tracks** within a playlist, viewing individual songs with album art, artist, and duration.
- **Play music** directly in the browser — either an entire playlist or a specific track within it — using the Spotify Web Playback SDK.
- **Control playback** with play/pause, previous/next track, seek, and volume controls.

The frontend handles **all audio playback** — the backend only brokers OAuth tokens and stores track/playlist metadata. The Spotify Web Playback SDK turns the browser into a Spotify Connect device, and playback commands are routed through the SDK's client-side API rather than through the DMD backend.

---

## 2. Architecture Summary

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         Browser (React Application)                        │
│                                                                            │
│  ┌─────────────────┐                                                       │
│  │   DmLayout       │  ← Calls useSpotifyPlayer() to keep player alive     │
│  │   ├── Header     │  ← Pre-warms auth status + token on mount            │
│  │   ├── Outlet ────┼──────────────────────────────────────────┐            │
│  │   └── BottomNav  │                                          │            │
│  └─────────────────┘                                          ▼            │
│                                                    ┌────────────────────┐  │
│                                                    │  AudioPlayerPage   │  │
│                                                    │  ├── LoginButton   │  │
│                                                    │  ├── SpotifyPlayer │  │
│                                                    │  └── PlaylistPanel │  │
│                                                    └────────┬───────────┘  │
│                                                             │              │
│  ┌──────────────────────────────────────────────────────────┼───────────┐  │
│  │                      Redux Store                         │           │  │
│  │  ┌──────────────────────┐   ┌──────────────────────────┐ │           │  │
│  │  │   spotifySlice       │   │   audioSlice (stub)      │ │           │  │
│  │  │  - auth state        │   │  - masterVolume          │ │           │  │
│  │  │  - player state      │   │  - isPlaying             │ │           │  │
│  │  │  - playlists         │   │  - currentTrack          │ │           │  │
│  │  │  - async thunks      │   └──────────────────────────┘ │           │  │
│  │  └──────────┬───────────┘                                │           │  │
│  └─────────────┼────────────────────────────────────────────┘           │  │
│                │                                                        │  │
│  ┌─────────────▼────────────────────────────────────────────────────┐   │  │
│  │              useSpotifyPlayer (Hook)                              │   │  │
│  │  - Loads SDK, creates singleton Spotify.Player                   │   │  │
│  │  - Dispatches player state changes → spotifySlice                │   │  │
│  │  - Returns player instance for control methods                   │   │  │
│  └──────────┬──────────────────────────────────┬────────────────────┘   │  │
│             │                                  │                        │  │
│             ▼                                  ▼                        │  │
│  ┌──────────────────┐               ┌───────────────────────┐          │  │
│  │  Spotify Web      │               │  DMD Backend          │          │  │
│  │  Playback SDK     │               │  /api/v1/auth/spotify │          │  │
│  │  (browser device) │               │  (token broker)       │          │  │
│  └──────────────────┘               └───────────────────────┘          │  │
│             │                                                           │  │
└─────────────┼───────────────────────────────────────────────────────────┘  │
              ▼                                                              │
   ┌────────────────────┐                                                    │
   │  Spotify API        │  ← Playlists + tracks fetched directly from Web API│
   │  (api.spotify.com)  │  ← Playback started via Web API PUT               │
   └────────────────────┘                                                    │
```

**Key architectural insight:** The frontend communicates with **two external services**:
1. **DMD Backend** — for OAuth token management (login, status check, token retrieval, logout).
2. **Spotify Web API** — directly, using the access token, for fetching playlists, playlist tracks, and starting playback.

Audio playback itself is handled by the **Spotify Web Playback SDK** embedded in the browser, which receives audio streams directly from Spotify's servers.

---

## 3. Directory Map

Every file relevant to the audio player feature:

```
frontend/
├── public/
│   └── index.html                              # Loads Spotify Web Playback SDK script
└── src/
    ├── app/
    │   ├── hooks.ts                            # Typed useAppDispatch, useAppSelector
    │   └── store.ts                            # Registers audio + spotify reducers
    ├── components/spotify/
    │   ├── SpotifyLoginButton.tsx               # OAuth popup login button
    │   ├── SpotifyPlayer.tsx                    # Playback controls + track display
    │   └── PlaylistPanel.tsx                    # Playlist grid + track list drill-down
    ├── config.ts                                # API_BASE_URL, SPOTIFY_AUTH_URL
    ├── features/
    │   ├── audioManager/
    │   │   ├── AudioManager.tsx                 # Empty — placeholder feature component
    │   │   └── audioSlice.ts                    # Stub Redux slice (masterVolume, etc.)
    │   └── spotify/
    │       └── spotifySlice.ts                  # Core Redux slice: auth, player, playlists
    ├── hooks/
    │   └── useSpotifyPlayer.ts                  # Singleton SDK player hook
    ├── layouts/
    │   └── DmLayout.tsx                         # Pre-warms auth, keeps player alive
    ├── pages/
    │   └── AudioPlayerPage.tsx                  # Main page component for /audio route
    ├── routes/
    │   └── AppRouter.tsx                        # Registers /audio under DmLayout
    ├── types/
    │   └── spotify-sdk.d.ts                     # TypeScript declarations for SDK globals
    └── utils/
        └── formatTime.ts                        # ms → "m:ss" formatter for progress display
```

---

## 4. Component Tree & Data Flow

When the user navigates to `/audio`, the rendered component tree is:

```
<Provider store={store}>                         ← Redux store
  <BrowserRouter>
    <DndProvider>                                 ← Drag-and-drop (not used by audio)
      <DmLayout>                                 ← useSpotifyPlayer() called here (keeps player alive)
        ├── <header> ... </header>               ← checkAuthStatus + fetchAccessToken on mount
        ├── <Outlet>
        │   └── <AudioPlayerPage>                ← Main audio feature entry point
        │       ├── <SpotifyLoginButton />       ← (shown when NOT logged in)
        │       ├── <SpotifyPlayer />            ← (shown when logged in)
        │       └── <PlaylistPanel />            ← (shown when logged in)
        └── <BottomNavBar />
      </DmLayout>
    </DndProvider>
  </BrowserRouter>
</Provider>
```

Data flows through two channels:

1. **Redux store** (`state.spotify`) — All auth state, player state, and playlist data lives here. Components read via `useAppSelector` and write via `useAppDispatch`.
2. **Player instance** — The `useSpotifyPlayer` hook returns the SDK player object. Components call methods on it directly for playback control (`togglePlay`, `seek`, `setVolume`, etc.).

---

## 5. Page: AudioPlayerPage

**File:** `src/pages/AudioPlayerPage.tsx`  
**Route:** `/audio` (nested under `DmLayout`)

The top-level page component that orchestrates the audio player feature. It manages three visual states:

| State | Condition | What Renders |
|-------|-----------|--------------|
| Loading | `isCheckingStatus === true` | "Checking Spotify connection..." spinner |
| Logged out | `isLoggedIn === false` | Title, description, and `<SpotifyLoginButton />` |
| Logged in | `isLoggedIn === true` | Header (with display name + logout), error banner, `<SpotifyPlayer />`, `<PlaylistPanel />` |

**Lifecycle behavior:**

1. On mount, dispatches `checkAuthStatus()` to query the backend.
2. Once `isLoggedIn && accessToken` are available, dispatches `fetchUserProfile()` to get the Spotify display name.
3. Provides a `handleLogout` that dispatches `logoutFromSpotify()`, which calls the backend and resets all Spotify Redux state.
4. Renders an error banner when `state.spotify.error` is set (e.g., expired session), with a "Reconnect" button that triggers logout (to reset and allow re-auth).

---

## 6. Components

### 6.1 SpotifyLoginButton

**File:** `src/components/spotify/SpotifyLoginButton.tsx`

A self-contained button component that manages the entire OAuth popup flow.

**Behavior:**

1. On click, opens a popup window pointing to `{SPOTIFY_AUTH_URL}/api/v1/auth/spotify/login`.
2. Starts a 500ms polling interval that checks `popupRef.current?.closed`.
3. When the popup closes (either by the user or auto-close after successful auth):
   - Dispatches `checkAuthStatus()` to confirm authentication succeeded.
   - If authenticated, immediately dispatches `fetchAccessToken()`.
   - Resets the `isAuthenticating` loading state.
4. Cleans up on unmount: clears the poll interval and closes the popup if still open.

**Visual states:**
- Default: Spotify logo icon + "Connect with Spotify" text.
- Authenticating: Spinning loader + "Connecting to Spotify..." text. Button is disabled.

### 6.2 SpotifyPlayer

**File:** `src/components/spotify/SpotifyPlayer.tsx`

The main playback control UI. Reads all state from Redux and delegates control to the player instance returned by `useSpotifyPlayer()`.

**Sections:**

| Section | Description |
|---------|-------------|
| Current Track | Album art, track name (gold gradient blackletter), artist names. Shows placeholder when nothing is playing. |
| Progress Bar | Range input (`<input type="range">`) bound to `position`/`duration`. Calls `player.seek()` on change. Displays formatted time on both sides. |
| Controls | Previous, Play/Pause (large gold circle), Next buttons. SVG icons, disabled when no track is loaded. |
| Volume | Volume icon + range slider (0–1, step 0.01). Dispatches `setVolume` and calls `player.setVolume()`. |

**Local position advancement:**

The component includes a `useEffect` that runs a 1-second interval while `isPlaying === true`. It increments `position` by 1000ms each tick by dispatching `setPlaybackState`. This provides smooth progress bar updates between the SDK's `player_state_changed` events, which only fire on actual state transitions (play, pause, track change, seek).

```
SDK fires player_state_changed → Redux gets exact position
  ↓
useEffect interval ticks every 1s → position += 1000ms
  ↓
SDK fires player_state_changed again → position resyncs to exact value
```

**Conditional rendering:** If `deviceId` is null (player not yet initialized), shows "Initializing player..." instead of controls.

### 6.3 PlaylistPanel

**File:** `src/components/spotify/PlaylistPanel.tsx`

A two-view component that lets the user browse playlists and drill down into individual tracks.

**Data fetching:** Dispatches `fetchPlaylists()` when `accessToken` becomes available. This thunk calls the Spotify Web API directly (`GET https://api.spotify.com/v1/me/playlists`).

#### View 1: Playlist Grid (default)

Renders when `selectedPlaylist` is `null`. Shows a 2-column (mobile) / 3-column (md) / 4-column (lg) responsive grid. Each card displays:
- Cover image (or a music note placeholder if no image).
- Playlist name (truncated).
- Track count.

**Click behavior:** Clicking a playlist card dispatches `selectPlaylist(playlist)` and `fetchPlaylistTracks(playlist.id)`, transitioning to the track list view.

#### View 2: Track List (drill-down)

Renders when `selectedPlaylist` is set. Shows:

| Element | Description |
|---------|-------------|
| **Back button** | Chevron + "Back" text. Dispatches `clearSelectedPlaylist()` to return to the grid. |
| **Playlist header** | Cover thumbnail (small), playlist name in gold blackletter. |
| **"Play All" button** | Gold button that plays the entire playlist from the first track. |
| **Track list** | Vertical list inside a `leather-card`. Each row shows: track number, album thumbnail (smallest available image), track name, artist names, and duration (formatted via `formatTime`). |

**Playing a specific track:** Clicking a track row calls `handlePlayTrack`, which starts playback of the playlist context at that track's offset:

```
PUT /v1/me/player/play?device_id={resolvedDeviceId}
Body: { context_uri: playlistUri, offset: { uri: trackUri } }
```

This tells Spotify to start the playlist from that specific song and continue with the rest of the playlist in order.

**Playing all tracks:** The "Play All" button calls `handlePlayAll`, which starts the playlist from the beginning without an offset (same as the previous behavior).

#### Device Resolution (shared by both play actions)

Both `handlePlayAll` and `handlePlayTrack` use a shared `resolveDeviceId` helper that:

1. Fetches the user's Spotify devices via `GET /v1/me/player/devices`.
2. Looks for the device named `"DMD Spotify Player"` (the SDK player created by `useSpotifyPlayer`).
3. Falls back to the `deviceId` from Redux if the named device isn't found.

This ensures playback targets the DMD browser tab specifically, even if other Spotify clients are active.

---

## 7. State Management (Redux)

### 7.1 spotifySlice

**File:** `src/features/spotify/spotifySlice.ts`  
**Store key:** `state.spotify`

The central Redux slice for all Spotify-related state. It contains:

```typescript
interface SpotifyState {
    // Authentication
    isLoggedIn: boolean;
    accessToken: string | null;
    tokenExpiry: string | null;
    isCheckingStatus: boolean;
    isFetchingToken: boolean;
    error: string | null;
    displayName: string | null;

    // Player state (from SDK events)
    isPlayerReady: boolean;
    deviceId: string | null;
    currentTrack: SpotifyTrack | null;
    isPlaying: boolean;
    position: number;         // in milliseconds
    duration: number;         // in milliseconds
    volume: number;           // 0.0 to 1.0

    // Playlists (from Spotify Web API)
    playlists: SpotifyPlaylist[];
    isFetchingPlaylists: boolean;

    // Selected playlist drill-down
    selectedPlaylist: SpotifyPlaylist | null;
    playlistTracks: SpotifyPlaylistTrackItem[];
    isFetchingTracks: boolean;
}
```

The state is logically divided into four groups:

1. **Authentication state** — Managed by async thunks that call the DMD backend.
2. **Player state** — Managed by synchronous actions dispatched from `useSpotifyPlayer` event listeners.
3. **Playlist state** — Managed by an async thunk that calls the Spotify Web API directly.
4. **Selected playlist state** — Tracks the currently selected playlist and its fetched tracks for the drill-down view.

### 7.2 audioSlice

**File:** `src/features/audioManager/audioSlice.ts`  
**Store key:** `state.audio`

A **stub/placeholder** slice with no reducers implemented. It defines the shape for a future generic audio manager:

```typescript
interface AudioState {
    masterVolume: number;   // default: 100
    isPlaying: boolean;     // default: false
    currentTrack: any;      // default: null
}
```

This slice is registered in the store but currently unused. It likely exists as scaffolding for a future multi-source audio manager that could unify local files, YouTube, and Spotify under a single interface.

### 7.3 Async Thunks

All async thunks use `createAsyncThunk` from Redux Toolkit and handle pending/fulfilled/rejected states:

| Thunk | What It Calls | Response |
|-------|--------------|----------|
| `checkAuthStatus` | `GET {API_BASE_URL}/api/v1/auth/spotify/status` | `boolean` — sets `isLoggedIn` |
| `fetchAccessToken` | `GET {API_BASE_URL}/api/v1/auth/spotify/token` | `{ accessToken, tokenExpiry }` — backend auto-refreshes if expired |
| `fetchPlaylists` | `GET https://api.spotify.com/v1/me/playlists` | `SpotifyPlaylist[]` — called with access token from Redux state |
| `fetchPlaylistTracks` | `GET https://api.spotify.com/v1/playlists/{id}/tracks?limit=50` | `SpotifyPlaylistTrackItem[]` — filters out null tracks, maps to clean type |
| `fetchUserProfile` | `GET https://api.spotify.com/v1/me` | `string` (display_name) |
| `logoutFromSpotify` | `POST {API_BASE_URL}/api/v1/auth/spotify/logout` | void — resets entire slice to `initialState` via `Object.assign` |

**API routing pattern:**
- Auth operations (token management) go through the **DMD backend** (`API_BASE_URL`).
- Data operations (playlists, profile) go directly to the **Spotify Web API** (`api.spotify.com`).

### 7.4 Synchronous Actions

Dispatched by the `useSpotifyPlayer` hook and `SpotifyPlayer` component:

| Action | Dispatched By | Purpose |
|--------|--------------|---------|
| `setPlayerReady({ ready, deviceId })` | SDK `ready` / `not_ready` events | Signals that the SDK player is connected and has a device ID |
| `setCurrentTrack(track)` | SDK `player_state_changed` | Updates the currently playing track info |
| `setPlaybackState({ isPlaying, position, duration })` | SDK `player_state_changed` + 1s interval | Updates playback progress |
| `setVolume(number)` | `SpotifyPlayer` volume slider | Updates volume in Redux (also calls `player.setVolume()`) |
| `setAuthError(message)` | SDK `authentication_error` | Sets error banner text when Spotify session expires |
| `selectPlaylist(playlist)` | `PlaylistPanel` on playlist card click | Stores selected playlist, clears stale tracks, triggers drill-down view |
| `clearSelectedPlaylist()` | `PlaylistPanel` Back button | Clears selected playlist and tracks, returns to grid view |
| `clearError()` | Available but currently unused | Clears the error field |
| `logout()` | Available but `logoutFromSpotify` thunk preferred | Resets auth state (synchronous version) |

---

## 8. Spotify Web Playback SDK Integration

### 8.1 SDK Loading

**File:** `public/index.html`

The Spotify Web Playback SDK is loaded via a `<script>` tag in the HTML head:

```html
<script src="https://sdk.scdn.co/spotify-player.js"></script>
```

This is a third-party script that exposes `window.Spotify.Player` once loaded. The SDK calls `window.onSpotifyWebPlaybackSDKReady` as its initialization callback.

### 8.2 useSpotifyPlayer Hook

**File:** `src/hooks/useSpotifyPlayer.ts`

The central hook that bridges the Spotify Web Playback SDK and the React/Redux application. It has three responsibilities:

1. **Wait for SDK readiness** — Checks if `window.Spotify` exists. If not, listens for a custom `spotify-sdk-ready` event.
2. **Initialize the player** — Creates a `Spotify.Player` instance when SDK is ready AND an access token is available.
3. **Manage lifecycle** — Disconnects the player on logout.

**SDK ready bridge:**

The hook registers a global callback before the SDK loads:

```typescript
if (!window.onSpotifyWebPlaybackSDKReady) {
    window.onSpotifyWebPlaybackSDKReady = () => {
        window.dispatchEvent(new Event('spotify-sdk-ready'));
    };
}
```

This converts the SDK's callback-based readiness signal into a DOM event that the hook can listen for reactively with `useEffect`.

### 8.3 Singleton Player Pattern

The player instance is stored in a **module-level variable** (`let playerInstance`), not in React state or a ref. This is intentional:

- The player must survive React component mount/unmount cycles (e.g., navigating away from `/audio` and back).
- `DmLayout` calls `useSpotifyPlayer()` at the layout level, ensuring the hook runs as long as the DM window is open, regardless of which child page is active.
- The singleton guard (`if (playerInstance) return`) prevents creating duplicate Spotify Connect devices.

**Lifecycle:**

```
DmLayout mounts
  └── useSpotifyPlayer() called
        ├── SDK not ready yet? → wait for event
        ├── SDK ready + token available + no existing instance?
        │     └── Create new Spotify.Player("DMD Spotify Player")
        │     └── Attach event listeners
        │     └── Call player.connect()
        │     └── Store in module-level playerInstance
        └── isLoggedIn becomes false?
              └── Disconnect player
              └── Set playerInstance = null
```

### 8.4 SDK Event Listeners

The hook attaches six event listeners to the player:

| Event | Redux Action | Behavior |
|-------|-------------|----------|
| `ready` | `setPlayerReady({ ready: true, deviceId })` | Player connected to Spotify; stores the device ID for playback commands |
| `not_ready` | `setPlayerReady({ ready: false, deviceId: null })` | Player disconnected (e.g., network issue) |
| `player_state_changed` | `setCurrentTrack(...)` + `setPlaybackState(...)` | Fires on play, pause, track change, seek — syncs Redux with actual playback state |
| `initialization_error` | Console error only | SDK failed to initialize |
| `authentication_error` | `setAuthError(message)` | Token rejected by Spotify — triggers error banner in UI with "Reconnect" option |
| `account_error` | Console error only | Spotify account issue (e.g., no Premium) |

---

## 9. Authentication Flow (Frontend Perspective)

### 9.1 Login Popup Flow

```
User clicks "Connect with Spotify"
  │
  ▼
SpotifyLoginButton.handleLogin()
  ├── Sets isAuthenticating = true
  ├── Opens popup: {SPOTIFY_AUTH_URL}/api/v1/auth/spotify/login
  │     └── Backend redirects popup to Spotify auth page
  │     └── User authorizes
  │     └── Backend callback exchanges code, stores token
  │     └── Backend returns HTML with window.close()
  │
  ├── Starts 500ms poll: popupRef.current?.closed
  │     └── When closed:
  │           ├── dispatch(checkAuthStatus())
  │           │     └── GET /api/v1/auth/spotify/status → { authenticated: true }
  │           │     └── Sets isLoggedIn = true
  │           ├── dispatch(fetchAccessToken())
  │           │     └── GET /api/v1/auth/spotify/token → { access_token, expiry }
  │           │     └── Sets accessToken in Redux
  │           └── Sets isAuthenticating = false
  │
  ▼
accessToken available in Redux
  └── useSpotifyPlayer creates SDK player → sets deviceId
  └── PlaylistPanel fetches playlists from Spotify API
  └── AudioPlayerPage fetches user profile
```

### 9.2 Auth Pre-warming in DmLayout

**File:** `src/layouts/DmLayout.tsx`

The `DmLayout` component performs **early auth initialization** in its `useEffect`:

```typescript
dispatch(checkAuthStatus()).then((result) => {
    if (result.payload === true) {
        dispatch(fetchAccessToken());
    }
});
```

This means:
- When the DM opens the app (on any page — screen mirroring, audio, or dungeon crawl), the Spotify auth status is checked and the token is fetched if previously authenticated.
- The `useSpotifyPlayer()` hook is also called in `DmLayout`, so the SDK player initializes as soon as the token is available.
- By the time the user navigates to `/audio`, the player may already be connected and ready.

### 9.3 Token Lifecycle

The frontend does **not** manage token refresh directly. It relies entirely on the backend:

1. Frontend calls `GET /api/v1/auth/spotify/token`.
2. Backend checks if the stored token is expired (or within 30s of expiry).
3. If expired, backend refreshes it via the Spotify API and saves the new token.
4. Backend returns a valid token to the frontend.

The frontend stores the token in Redux (`state.spotify.accessToken`). It does not persist tokens to localStorage or handle refresh timers. If the token expires during a long session, the SDK will fire an `authentication_error` event, which sets an error banner prompting the user to reconnect.

---

## 10. Playback Flow

### Browsing and selecting a track

The user first selects a playlist, then picks a specific track (or plays all):

```
PlaylistPanel: user clicks playlist card
  │
  ├── dispatch(selectPlaylist(playlist))      → stores playlist in Redux
  ├── dispatch(fetchPlaylistTracks(id))       → GET /v1/playlists/{id}/tracks
  │
  ▼
PlaylistPanel re-renders: track list view
  │
  ├── Option A: user clicks "Play All"
  │     └── handlePlayAll()
  │           Body: { context_uri: playlistUri }
  │
  └── Option B: user clicks a specific track
        └── handlePlayTrack(track)
              Body: { context_uri: playlistUri, offset: { uri: trackUri } }
```

### Starting playback (shared by both options)

```
handlePlayAll() or handlePlayTrack()
  │
  ├── 1. resolveDeviceId()
  │        GET https://api.spotify.com/v1/me/player/devices
  │        → Find device with name "DMD Spotify Player"
  │        → Fall back to deviceId from Redux
  │
  ├── 2. PUT https://api.spotify.com/v1/me/player/play?device_id={resolvedDeviceId}
  │        Headers: Authorization: Bearer {accessToken}
  │        Body: { context_uri, offset? }
  │        → Spotify starts streaming to the browser SDK player
  │
  └── 3. SDK fires player_state_changed
           │
           ├── useSpotifyPlayer dispatches setCurrentTrack(track)
           ├── useSpotifyPlayer dispatches setPlaybackState({...})
           │
           └── SpotifyPlayer re-renders with:
                 ├── Album art, track name, artists
                 ├── Progress bar with position/duration
                 └── Play/pause button shows "pause" icon
```

### Transport controls (play/pause, next, previous, seek, volume)

```
SpotifyPlayer: user clicks control
  │
  ├── Calls player.togglePlay() / player.nextTrack() / etc.
  │     (direct SDK method call on the singleton instance)
  │
  └── SDK processes command and fires player_state_changed
        └── Redux state updates → UI re-renders
```

---

## 11. Type System

### 11.1 Spotify SDK Type Declarations

**File:** `src/types/spotify-sdk.d.ts`

Provides TypeScript type safety for the globally-loaded Spotify SDK. Augments the `Window` interface:

| Interface | Purpose |
|-----------|---------|
| `Window.onSpotifyWebPlaybackSDKReady` | Callback the SDK invokes when loaded |
| `Window.Spotify.Player` | Constructor for the playback SDK |
| `SpotifyPlayer` | Instance methods: `connect`, `disconnect`, `togglePlay`, `seek`, `setVolume`, `previousTrack`, `nextTrack`, `addListener`, etc. |
| `SpotifyPlayerState` | Shape of the state object from `player_state_changed`: `paused`, `position`, `duration`, `track_window` |
| `SpotifyTrack` | Track metadata: `id`, `uri`, `name`, `artists[]`, `album` (with `images[]`), `duration_ms` |

These are ambient declarations (no `import`/`export`) that are available globally across the project.

### 11.2 Redux State Types

**Defined inline in `spotifySlice.ts`:**

| Interface | Fields |
|-----------|--------|
| `SpotifyState` | Full state shape — 20 fields across auth, player, playlist, and selected playlist groups |
| `SpotifyPlaylist` | `id`, `name`, `description`, `images[]`, `tracks.total`, `uri` |
| `SpotifyPlaylistTrackItem` | `id`, `name`, `uri`, `duration_ms`, `artists[]`, `album` (with `images[]`) — exported for use by `PlaylistPanel` |

`SpotifyTrack` is reused from the SDK type declarations (ambient global). `SpotifyPlaylistTrackItem` is a separate, lighter type used for playlist track listings (it has a simpler shape than the SDK's `SpotifyTrack`).

---

## 12. Routing & Navigation

**File:** `src/routes/AppRouter.tsx`

The audio player page is registered as a child route of `DmLayout`:

```
/           → DmLayout > ScreenMirroringPage  (index route)
/audio      → DmLayout > AudioPlayerPage
/crawl      → DmLayout > DungeonCrawlPage
/player     → PlayerDisplayPage               (separate window, no DmLayout)
```

Because `AudioPlayerPage` is a child of `DmLayout`, it benefits from:
- The layout's `useSpotifyPlayer()` call (player stays alive across navigations).
- The layout's auth pre-warming (token may already be available).
- The shared `BottomNavBar` with an "Audio Player" tab.

**File:** `src/components/layout/BottomNavBar.tsx`

The bottom navigation bar renders a `<NavLink to="/audio">Audio Player</NavLink>` entry. Active state is styled with `bg-arcane-purple text-parchment`.

---

## 13. Styling & UI Theme

The audio player uses the application's high-fantasy D&D theme, implemented with Tailwind CSS custom classes:

| CSS Class | Where Used | Visual Effect |
|-----------|-----------|---------------|
| `leather-card` | SpotifyPlayer wrapper | Dark leather-textured card background |
| `parchment-texture parchment-edge` | Playlist cards | Aged parchment look with torn edges |
| `gold-gradient-text` | Track title, page headers | Gold metallic gradient text |
| `font-blackletter` | Headers, nav links | Medieval blackletter typeface |
| `text-faded-ink` | Secondary text (artists, status) | Muted ink color |
| `text-parchment` | Primary readable text | Light parchment-colored text |
| `bg-paladin-gold` | Play/pause button, login button | Gold accent color |
| `arcane-slider` | Progress bar, volume slider | Custom-styled range input |
| `arcane-glow-hover` | Playlist cards, login button | Subtle glow effect on hover |
| `bg-obsidian` | Page background (from DmLayout) | Near-black background |
| `text-ink` | Button text on gold background | Dark ink color for contrast |
| `bg-arcane-purple` | Active nav tab | Purple accent for active state |
| `text-wax-red` | Logout hover state | Red accent for destructive actions |

---

## 14. Configuration

**File:** `src/config.ts`

```typescript
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
export const SPOTIFY_AUTH_URL = process.env.REACT_APP_SPOTIFY_AUTH_URL || 'http://127.0.0.1:8080';
```

| Constant | Default | Used By | Purpose |
|----------|---------|---------|---------|
| `API_BASE_URL` | `http://localhost:8080` | `spotifySlice` thunks | Base URL for DMD backend API calls (auth status, token, logout) |
| `SPOTIFY_AUTH_URL` | `http://127.0.0.1:8080` | `SpotifyLoginButton` | Base URL for the OAuth login popup. Uses `127.0.0.1` to match Spotify's redirect URI configuration. |

The two constants exist separately because OAuth redirect URIs are strict about hostname — `localhost` and `127.0.0.1` are treated as different origins by Spotify's authorization server.

---

## 15. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Module-level singleton player** | The SDK player must survive React re-renders and page navigations. A module-level variable outside React's lifecycle ensures exactly one Spotify Connect device exists. |
| **Player initialized in DmLayout, not AudioPlayerPage** | Keeps the player alive when the user navigates to other tabs (Screen Mirroring, Dungeon Crawl). Music continues playing seamlessly across page changes. |
| **Auth pre-warming in DmLayout** | By checking auth status and fetching the token on app load (not just when visiting `/audio`), the player can start initializing immediately. The user hears no delay when they first click "Audio Player". |
| **Popup-based OAuth (not redirect)** | Avoids navigating the main app window away from the current page. The popup auto-closes after auth, and the main window detects completion via polling. |
| **500ms popup polling** | Browser security restrictions prevent reading cross-origin popup content. Polling `popup.closed` is the standard approach for detecting when the OAuth flow completes. |
| **Direct Spotify Web API calls from frontend** | Playlists and playback commands use the Spotify API directly (with the access token) rather than proxying through the backend. This reduces backend complexity and latency for real-time playback operations. |
| **Two-step device resolution for playback** | Fetching devices and matching by name (`"DMD Spotify Player"`) before playing ensures the correct device is targeted even when the user has other Spotify clients open. |
| **Local position advancement (1s interval)** | The SDK only fires `player_state_changed` on discrete events. The 1-second interval provides smooth progress bar movement between events, resyncing to the exact position whenever the SDK fires next. |
| **Error banner with "Reconnect"** | When the SDK fires `authentication_error`, the UI shows an actionable banner. "Reconnect" triggers logout + clears state, allowing the user to re-authenticate cleanly. |
| **Playlist drill-down with track selection** | Clicking a playlist shows its tracks instead of immediately playing. This gives the DM precise control over which song to start, critical for setting the right mood at the right moment during a session. "Play All" remains available for when an entire playlist fits. |
| **audioSlice as a stub** | Reserved for a future generic audio manager that could unify multiple sources. Currently all real state lives in `spotifySlice`. |
| **Separate API_BASE_URL and SPOTIFY_AUTH_URL** | OAuth redirect URIs are strict about hostname matching. The auth URL uses `127.0.0.1` while general API calls use `localhost`. Both resolve to the same backend in development. |

---

## 16. Dependencies

Audio-player-relevant dependencies from `package.json`:

| Package | Version | Role |
|---------|---------|------|
| `react` | ^18.3.1 | UI framework |
| `react-dom` | ^18.3.1 | DOM rendering |
| `react-router-dom` | ^6.25.1 | Client-side routing (`/audio` route, `NavLink`) |
| `@reduxjs/toolkit` | ^2.2.6 | Redux state management, `createSlice`, `createAsyncThunk` |
| `react-redux` | ^9.1.2 | React bindings for Redux (`Provider`, `useSelector`, `useDispatch`) |
| `axios` | ^1.7.2 | HTTP client for backend API + Spotify Web API calls |
| `tailwindcss` | ^3.4.6 | Utility-first CSS framework for all styling |
| `clsx` | ^2.1.1 | Conditional class name utility |
| `tailwind-merge` | ^2.4.0 | Merges Tailwind classes without conflicts |
| `typescript` | ^5.5.4 | Type safety, including SDK type declarations |

**External (no npm package):**

| Resource | How Loaded | Role |
|----------|-----------|------|
| Spotify Web Playback SDK | `<script src="https://sdk.scdn.co/spotify-player.js">` in `index.html` | Turns the browser into a Spotify Connect device for audio playback |
