# Screen Mirroring — Frontend Documentation

## Table of Contents

- [1. Feature Overview](#1-feature-overview)
- [2. Architecture Summary](#2-architecture-summary)
- [3. Directory Map](#3-directory-map)
- [4. Dual-Window System](#4-dual-window-system)
  - [4.1 DM Window (ScreenMirroringPage)](#41-dm-window-screenmirroring-page)
  - [4.2 Player Window (PlayerDisplayPage)](#42-player-window-playerdisplaypage)
  - [4.3 Window Lifecycle Management](#43-window-lifecycle-management)
- [5. BroadcastChannel Protocol](#5-broadcastchannel-protocol)
  - [5.1 Why BroadcastChannel, Not WebSocket](#51-why-broadcastchannel-not-websocket)
  - [5.2 Channel Name and Hook](#52-channel-name-and-hook)
  - [5.3 Message Types](#53-message-types)
  - [5.4 Message Flow Diagrams](#54-message-flow-diagrams)
- [6. Layout State Machine](#6-layout-state-machine)
  - [6.1 Core Types](#61-core-types)
  - [6.2 State Transitions](#62-state-transitions)
  - [6.3 Layout Lifecycle](#63-layout-lifecycle)
- [7. Page Components](#7-page-components)
  - [7.1 ScreenMirroringPage (Orchestrator)](#71-screenmirroring-page-orchestrator)
  - [7.2 PlayerDisplayPage (Renderer)](#72-playerdisplaypage-renderer)
- [8. UI Components](#8-ui-components)
  - [8.1 ScreenMirroringToolbar](#81-screenmirroring-toolbar)
  - [8.2 AssetPanel](#82-assetpanel)
  - [8.3 StagingArea](#83-stagingarea)
  - [8.4 ImageSlot](#84-imageslot)
  - [8.5 LayoutSelector](#85-layoutselector)
  - [8.6 PresetPanel & PresetItem](#86-presetpanel--presetitem)
  - [8.7 EditAssetModal](#87-editassetmodal)
  - [8.8 DraggableAsset & FilterPills](#88-draggableasset--filterpills)
- [9. Drag-and-Drop System](#9-drag-and-drop-system)
  - [9.1 Overview](#91-overview)
  - [9.2 Item Types](#92-item-types)
  - [9.3 Drag Sources](#93-drag-sources)
  - [9.4 Drop Targets](#94-drop-targets)
- [10. State Management](#10-state-management)
  - [10.1 Redux Store (Global State)](#101-redux-store-global-state)
  - [10.2 displaySlice](#102-displayslice)
  - [10.3 imageSlice](#103-imageslice)
  - [10.4 Local Component State](#104-local-component-state)
- [11. WebSocket Integration (Image Library Sync)](#11-websocket-integration-image-library-sync)
- [12. API Integration](#12-api-integration)
  - [12.1 Image Library Endpoints](#121-image-library-endpoints)
  - [12.2 Preset Endpoints](#122-preset-endpoints)
  - [12.3 Upload Endpoint](#123-upload-endpoint)
- [13. Custom Hooks](#13-custom-hooks)
  - [13.1 useBroadcastChannel](#131-usebroadcastchannel)
  - [13.2 useWebSocket](#132-usewebsocket)
  - [13.3 useHorizontalScroll](#133-usehorizontalscroll)
- [14. TypeScript Types](#14-typescript-types)
- [15. Routing & Layouts](#15-routing--layouts)
  - [15.1 Route Structure](#151-route-structure)
  - [15.2 DmLayout](#152-dmlayout)
  - [15.3 BottomNavBar](#153-bottomnavbar)
- [16. Styling & Theming](#16-styling--theming)
- [17. Configuration](#17-configuration)
- [18. Key Design Decisions](#18-key-design-decisions)
- [19. Component Tree](#19-component-tree)
- [20. Legacy / Unused Code](#20-legacy--unused-code)
- [21. Dependencies](#21-dependencies)

---

## 1. Feature Overview

The Screen Mirroring feature provides a dual-window system for D&D sessions: the Dungeon Master (DM) operates a control panel in the main browser tab while a separate player-facing window displays selected images, maps, and layouts. The two windows communicate in real time, allowing the DM to stage visual content, push it to players instantly, and adjust it live.

The frontend is the primary owner of the Screen Mirroring feature. It handles:

- **Dual-window management** — Opening, closing, focusing, and monitoring the player window's lifecycle.
- **Layout staging** — A drag-and-drop workspace where the DM assembles image layouts (single, dual, or quad grids) with per-slot zoom controls.
- **Cross-window communication** — A `BroadcastChannel`-based protocol for pushing display state from DM to player and synchronizing state between the two windows.
- **Image library browsing** — A filterable, scrollable gallery of available images loaded from the backend, with drag-and-drop into layout slots.
- **Image upload** — A file picker for uploading new images to the backend.
- **Preset management** — Saving, loading, and deleting pre-configured layout arrangements via the backend API.
- **Player rendering** — The player window renders the active layout with appropriate grid, images, and zoom levels.

The backend's role is limited to persisting image metadata, serving image files, managing presets, and notifying the frontend when the image library changes. All display logic, state management, and window coordination live in the frontend.

---

## 2. Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DM Window (localhost:3000/)                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  DmLayout                                                           │    │
│  │  ├── WebSocket (useWebSocket) ──► images_updated ──► fetchImages()  │    │
│  │  ├── BottomNavBar (navigation)                                      │    │
│  │  └── <Outlet> ──► ScreenMirroringPage                               │    │
│  │       ├── ScreenMirroringToolbar (window controls)                  │    │
│  │       ├── AssetPanel (image gallery + presets)                      │    │
│  │       │    ├── DraggableAsset ──drag──► ImageSlot                   │    │
│  │       │    ├── FilterPills (type filtering)                         │    │
│  │       │    ├── EditAssetModal (metadata editing)                    │    │
│  │       │    └── PresetPanel ──► PresetItem (saved layouts)           │    │
│  │       └── StagingArea (layout workspace)                            │    │
│  │            ├── LayoutSelector (single/dual/quad)                    │    │
│  │            └── ImageSlot[] (drop targets + drag sources)            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                              │
│                    BroadcastChannel                                         │
│                     'dmd-channel'                                           │
│                              │                                              │
│               show_layout / clear_layout /                                  │
│            request_current_content / responses                              │
│                              │                                              │
│  ┌───────────────────────────▼─────────────────────────────────────────┐    │
│  │  Player Window (localhost:3000/player)                               │    │
│  │                                                                      │    │
│  │  PlayerDisplayPage                                                   │    │
│  │  ├── Redux: state.display.currentLayout                             │    │
│  │  ├── Renders grid (single/dual/quad) with images + zoom             │    │
│  │  └── Default: party.jpeg when no layout is active                   │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Redux Store                                                         │   │
│  │  ├── display: { currentLayout: LayoutState | null }                  │   │
│  │  └── images: { items: MediaAsset[], status }                         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Backend API (localhost:8080)                                        │   │
│  │  ├── GET  /api/v1/images/images       (library)                     │   │
│  │  ├── PUT  /api/v1/images/images/{id}  (edit metadata)               │   │
│  │  ├── GET  /api/v1/images/types        (filter types)                │   │
│  │  ├── POST /api/v1/images/upload       (file upload)                 │   │
│  │  ├── GET  /api/v1/images/presets      (list presets)                │   │
│  │  ├── POST /api/v1/images/presets      (save preset)                 │   │
│  │  ├── DEL  /api/v1/images/presets/{id} (delete preset)               │   │
│  │  ├── /static/images/*                 (serve image files)           │   │
│  │  └── /ws                              (WebSocket: images_updated)   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

The architecture has three tiers:

1. **DM Window** — The orchestrator. Contains the staging workspace, asset browser, toolbar, and all interaction logic. Manages layout state locally in `useState` and communicates with the player window via `BroadcastChannel`.
2. **Player Window** — The renderer. A minimal component that receives layout state via `BroadcastChannel`, stores it in Redux, and renders the appropriate grid. No user interaction beyond viewing.
3. **Backend** — The data layer. Serves images, persists metadata and presets, and sends `images_updated` WebSocket events when the image library changes.

---

## 3. Directory Map

Every frontend file relevant to the Screen Mirroring feature:

```
frontend/src/
├── pages/
│   ├── ScreenMirroringPage.tsx            # DM staging page — orchestrates all Screen Mirroring logic
│   └── PlayerDisplayPage.tsx              # Player window — renders the active layout
├── components/
│   ├── screen-mirroring/
│   │   ├── ScreenMirroringToolbar.tsx     # Window controls: open/close, show/hide, sync, focus
│   │   ├── AssetPanel.tsx                 # Tabbed panel: Assets gallery + Presets browser
│   │   ├── StagingArea.tsx                # Layout workspace: grid + slots + status badge
│   │   ├── ImageSlot.tsx                  # Single slot: drop target, drag source, zoom controls
│   │   ├── LayoutSelector.tsx             # Single/dual/quad toggle + save preset button
│   │   ├── PresetPanel.tsx                # Horizontally scrollable list of saved presets
│   │   ├── PresetItem.tsx                 # Single preset thumbnail with load/delete
│   │   └── EditAssetModal.tsx             # Modal for editing an image's type/group
│   ├── layout/
│   │   └── BottomNavBar.tsx               # Tab navigation: Screen Mirroring / Audio / Crawl
│   └── dm/
│       └── DmToolbar.tsx                  # (Legacy) Original toolbar, not currently mounted
├── features/
│   ├── display/
│   │   └── displaySlice.ts               # Redux slice: currentLayout for the player window
│   └── images/
│       └── imageSlice.ts                  # Redux slice: image library + fetchImages thunk
├── hooks/
│   ├── useBroadcastChannel.ts             # Hook: creates BroadcastChannel, wires onmessage
│   ├── useWebSocket.ts                    # Hook: connects to backend WS, parses messages
│   └── useHorizontalScroll.ts             # Hook: converts vertical wheel to horizontal scroll
├── layouts/
│   └── DmLayout.tsx                       # DM shell: header, WebSocket, Outlet, nav bar
├── routes/
│   └── AppRouter.tsx                      # Route definitions + DndProvider wrapper
├── app/
│   ├── store.ts                           # Redux store configuration (display + images slices)
│   └── hooks.ts                           # Typed useAppDispatch, useAppSelector
├── types/
│   └── api.ts                             # MediaAsset, PresetLayout, PresetLayoutSlot types
├── config.ts                              # API_BASE_URL, DEFAULT_PLAYER_WINDOW_IMG
└── index.tsx                              # App bootstrap: Provider, BrowserRouter, AppRouter
```

---

## 4. Dual-Window System

### 4.1 DM Window (ScreenMirroringPage)

The DM window is the main application tab at `/`. It runs inside `DmLayout` and renders the `ScreenMirroringPage`. This is where all staging, asset management, and display control happens.

The DM can:
- Browse and filter the image library.
- Drag images into layout slots.
- Switch between single, dual, and quad layouts.
- Zoom individual slots in or out.
- Push the current layout to the player window ("Show To Players").
- Hide the content from the player window.
- Save the current layout as a preset.
- Load a saved preset.
- Upload new image files.

### 4.2 Player Window (PlayerDisplayPage)

The player window is a separate browser popup opened at `/player`. It is purely a display — there are no interactive controls for users.

When no layout is active, it shows a default image (`party.jpeg`). When a layout is pushed from the DM window, it renders a CSS grid matching the layout type (`single` / `dual` / `quad`) with images at their specified zoom levels.

The player window stores its current layout in Redux (`state.display.currentLayout`) so it can respond to sync requests from the DM window even after the DM navigates away and returns.

### 4.3 Window Lifecycle Management

**File:** `ScreenMirroringToolbar.tsx`

The player window is managed via `window.open()` and a module-scoped reference:

```typescript
let playerWindowRef: Window | null = null;
```

This reference is stored at **module scope** (outside the component) so it persists across React Router navigations. When the DM navigates to `/audio` or `/crawl` and back, the toolbar can reconnect to the already-open player window without losing the reference.

**Opening:** `window.open('/player', 'dmdPlayerWindow', 'popup,width=1280,height=720')` opens a named popup. The named window ensures that calling `window.open` with the same name reuses the existing window rather than opening a duplicate.

**Close detection:** A `setInterval` polls `playerWindow.closed` every 1 second. When the player window is closed (by the user or programmatically), the DM side clears its reference and updates the toolbar state. The layout status reverts from `live` to `staged` if content was being displayed.

**Focus:** The "Focus Player Window" button calls `playerWindow.focus()`, with an instructional note to use F11 for fullscreen — the intended presentation mode.

---

## 5. BroadcastChannel Protocol

### 5.1 Why BroadcastChannel, Not WebSocket

The display synchronization between DM and player windows uses the browser's native `BroadcastChannel` API, **not** the backend WebSocket. This is a deliberate architectural choice:

- Both windows are tabs/popups in the **same browser** on the **same machine**. `BroadcastChannel` is a zero-latency, browser-native IPC mechanism designed for exactly this use case.
- No backend round-trip is needed — display commands don't need to be persisted or routed through the server.
- The WebSocket is reserved for **server-initiated** events (like `images_updated` when files change on disk).

### 5.2 Channel Name and Hook

All Screen Mirroring communication uses a single channel named `'dmd-channel'`.

**File:** `hooks/useBroadcastChannel.ts`

```typescript
export interface BroadcastMessage {
    type: string;
    payload?: any;
}

export function useBroadcastChannel(
    channelName: string,
    onMessage: (message: BroadcastMessage) => void
) {
    const channel = useMemo(() => new BroadcastChannel(channelName), [channelName]);

    useEffect(() => {
        channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
            onMessage(event.data);
        };
        return () => { channel.onmessage = null; };
    }, [channel, onMessage]);

    return channel;
}
```

The DM page uses this hook. The player page creates a raw `BroadcastChannel` directly via `useMemo` (without the hook) because it needs the channel instance in `useCallback` for response messages.

### 5.3 Message Types

| Direction | Type | Payload | Description |
|-----------|------|---------|-------------|
| DM → Player | `show_layout` | `LayoutState` | Push the current staged layout to the player display. |
| DM → Player | `clear_layout` | — | Clear the player display (return to default image). |
| DM → Player | `request_current_content` | — | Ask the player window what it's currently displaying. |
| Player → DM | `response_current_content` | `LayoutState` | Reply with the current layout state. |
| Player → DM | `response_is_empty` | — | Reply that no layout is currently displayed. |

### 5.4 Message Flow Diagrams

**Showing content to players:**

```
  DM clicks "Show To Players"
         │
         ▼
  ScreenMirroringPage.handleShowToPlayers()
         │
         ├── Sets layoutState.status = 'live'
         │
         └── channel.postMessage({ type: 'show_layout', payload: layoutState })
                    │
                    ▼
              PlayerDisplayPage receives message
                    │
                    └── dispatch(setCurrentLayout(payload))
                             │
                             └── Renders grid with images
```

**Syncing on DM page load (re-navigation):**

```
  DM navigates back to Screen Mirroring page
         │
         ▼
  ScreenMirroringPage mounts
         │
         └── useEffect: channel.postMessage({ type: 'request_current_content' })
                    │
                    ▼
              PlayerDisplayPage receives request
                    │
                    ├── If currentLayout exists:
                    │      channel.postMessage({ type: 'response_current_content', payload })
                    │
                    └── If empty:
                           channel.postMessage({ type: 'response_is_empty' })
                                      │
                                      ▼
                    DM receives response and restores local state
```

**Live zoom update:**

```
  DM changes zoom on a slot while layout is live
         │
         ▼
  handleZoomChange() detects status === 'live'
         │
         ├── Updates local slot zoom
         │
         └── channel.postMessage({ type: 'show_layout', payload: updatedState })
                    │
                    ▼
              Player window updates in real time
```

---

## 6. Layout State Machine

### 6.1 Core Types

**File:** `pages/ScreenMirroringPage.tsx`

```typescript
export type LayoutType = 'single' | 'dual' | 'quad';
export type LayoutStatus = 'empty' | 'staged' | 'live';

export interface ImageSlotState {
    slotId: number;
    url: string | null;
    zoom: number;
    imageId: number | null;
}

export interface LayoutState {
    layout: LayoutType;
    status: LayoutStatus;
    slots: ImageSlotState[];
}
```

- `LayoutType` — The grid configuration. Determines how many slots exist (1, 2, or 4).
- `LayoutStatus` — A three-state lifecycle: `empty` → `staged` → `live`.
- `ImageSlotState` — Per-slot state: which image is loaded (by URL and ID), its zoom level, and its position in the grid.
- `LayoutState` — The complete state of the staging area. This exact object is what gets sent to the player window.

### 6.2 State Transitions

```
                    ┌──────────────────────┐
                    │       EMPTY           │
                    │  (no images in slots) │
                    └──────────┬───────────┘
                               │
                     Drop image into slot
                               │
                    ┌──────────▼───────────┐
                    │       STAGED          │
                    │ (images ready,        │
                    │  not yet displayed)   │◄──── Hide From Players
                    └──────────┬───────────┘
                               │
                    Show To Players
                               │
                    ┌──────────▼───────────┐
                    │        LIVE           │
                    │ (actively displayed   │
                    │  on player window)    │
                    └──────────────────────┘
```

**Transitions:**
- `empty → staged`: Dropping an image into any slot.
- `staged → empty`: Clearing the last remaining image from all slots.
- `staged → live`: Clicking "Show To Players" (sends `show_layout`).
- `live → staged`: Clicking "Hide From Players" (sends `clear_layout`), or the player window closes.
- Layout change (selecting a different layout type): Resets to `empty` regardless of current status.

### 6.3 Layout Lifecycle

The initial layout state is created by `createInitialLayoutState`:

```typescript
const createInitialLayoutState = (layout: LayoutType): LayoutState => {
    const slotCount = layout === 'quad' ? 4 : layout === 'dual' ? 2 : 1;
    return {
        layout,
        status: 'empty',
        slots: Array.from({ length: slotCount }, (_, i) => ({
            slotId: i, url: null, zoom: 1, imageId: null
        })),
    };
};
```

Every layout starts with all slots empty, default zoom of 1 (100%), and status `empty`.

---

## 7. Page Components

### 7.1 ScreenMirroringPage (Orchestrator)

**File:** `pages/ScreenMirroringPage.tsx`
**Route:** `/` (index route under `DmLayout`)

The central coordinator of the Screen Mirroring feature. All event handlers, state management, and child component wiring happen here. It uses **local `useState`** (not Redux) for the layout state because this state is specific to the staging workflow and doesn't need to be shared with other features.

**Local state:**

| State | Type | Purpose |
|-------|------|---------|
| `layoutState` | `LayoutState` | The current layout configuration (type, status, slots) |
| `notification` | `string \| null` | Notification message text |
| `isNotificationVisible` | `boolean` | Controls notification fade-in/out |
| `isSaving` | `boolean` | Preset save in-progress indicator |
| `presetRefreshKey` | `number` | Counter to trigger preset list re-fetch |

**Event handlers defined here:**

| Handler | Trigger | Action |
|---------|---------|--------|
| `handleLayoutChange` | Layout selector click | Resets to a new empty layout of the chosen type |
| `handleDropAsset` | Image dropped from gallery into a slot | Sets the slot's URL and imageId, status becomes `staged` |
| `handleClearSlot` | Slot clear button click | Clears the slot; reverts status to `empty` if no slots filled |
| `handleShowToPlayers` | "Show To Players" button | Broadcasts `show_layout`, sets status to `live` |
| `handleHideFromPlayers` | "Hide From Players" button | Broadcasts `clear_layout`, sets status to `staged` |
| `handleSyncWithPlayer` | "Get Player View" button | Broadcasts `request_current_content` |
| `handleZoomChange` | Zoom controls on a slot | Updates zoom; if live, immediately broadcasts updated state |
| `handleMoveAsset` | Image dragged between slots | Swaps slot contents; if live, immediately broadcasts |
| `handleSavePreset` | Save button click | POSTs current layout to backend as a preset |
| `handleLoadPreset` | Preset item click | Converts a `PresetLayout` from the API into a `LayoutState` |
| `handleDeletePreset` | Preset delete button | DELETEs preset via API, triggers refresh |
| `handleFileUpload` | File input change | Uploads image via multipart form to backend |
| `handleChannelMessage` | BroadcastChannel message | Handles `response_current_content` and `response_is_empty` |

**Refs:**

| Ref | Purpose |
|-----|---------|
| `fileInputRef` | Hidden file input element for image upload |
| `notificationTimerRef` | Timeout handle for auto-dismissing notifications |

**Mount behavior:** On mount, the page sends `request_current_content` via BroadcastChannel to sync with an already-open player window. This handles the case where the DM navigated away (to Audio or Crawl) and came back — the staging area restores the last-sent layout from the player window's state.

### 7.2 PlayerDisplayPage (Renderer)

**File:** `pages/PlayerDisplayPage.tsx`
**Route:** `/player`

A minimal, stateless-feeling component that receives layout commands via BroadcastChannel and renders them. It stores the current layout in Redux (`state.display.currentLayout`) so it persists across re-renders and can respond to sync requests.

**Rendering logic:**

- If `currentLayout` is `null`: Displays a default image (`party.jpeg`) centered on a black background.
- If `currentLayout` exists: Renders a CSS grid with classes matching the layout type (`grid-cols-1`, `grid-cols-2`, `grid-cols-2 grid-rows-2`), with each slot's image rendered at the specified zoom level via `transform: scale(zoom)`.

**BroadcastChannel handling:**

- `show_layout` → `dispatch(setCurrentLayout(payload))`
- `clear_layout` → `dispatch(clearLayout())`
- `request_current_content` → Responds with current layout state or `response_is_empty`

---

## 8. UI Components

### 8.1 ScreenMirroringToolbar

**File:** `components/screen-mirroring/ScreenMirroringToolbar.tsx`

The top bar of the DM's Screen Mirroring page. Provides four action buttons:

| Button | Behavior | Enabled When |
|--------|----------|--------------|
| Open/Close Players Window | Opens a popup at `/player` or closes it | Always |
| Show/Hide To Players | Pushes or clears layout to/from the player window | Player window open AND layout not empty |
| Get Player View | Requests the player window's current state to restore DM staging | Player window open |
| Focus Player Window | Brings the player window to the foreground | Player window open |

The toolbar adapts visually based on `previewStatus`:
- `staged` → "Show To Players" is gold
- `live` → "Hide From Players" is red
- `empty` → Show/Hide is disabled

The component also manages the player window lifecycle via `window.open`, polling, and a module-scoped `playerWindowRef`.

### 8.2 AssetPanel

**File:** `components/screen-mirroring/AssetPanel.tsx`

A tabbed panel with two views:

1. **Assets tab** — Shows the image gallery (`AssetSelectionBar`), type filter pills (`FilterPills`), and the "Browse" upload button. Fetches images from `GET /api/v1/images/images` with optional `?type=` filtering via local state (not the Redux `imageSlice`).
2. **Presets tab** — Shows the `PresetPanel` with saved layout configurations.

The panel owns its own local asset state and `refreshKey` counter. When an image's metadata is updated via `EditAssetModal`, the `refreshKey` increments to trigger a re-fetch of both the asset list and the type filter pills.

**Key child components:**
- `DraggableAsset` — Wraps each image thumbnail in a `react-dnd` drag source.
- `FilterPills` — Horizontally scrollable type filter buttons fetched from `GET /api/v1/images/types`.
- `AssetSelectionBar` — The scrollable row of draggable image thumbnails with a "Browse" button at the end.

### 8.3 StagingArea

**File:** `components/screen-mirroring/StagingArea.tsx`

The main workspace that contains the layout grid. It renders:

- A **LayoutSelector** in the top-left corner.
- A **status badge** ("STAGED" or "LIVE") at the top center.
- A **notification banner** for upload success/error messages.
- A **CSS grid** of `ImageSlot` components, with grid classes determined by the layout type.
- A **watermark** (DMD logo at low opacity) behind the slots.

The border color reflects the current status:
- `empty` → Dashed, faded
- `staged` → Solid, purple
- `live` → Solid, gold

### 8.4 ImageSlot

**File:** `components/screen-mirroring/ImageSlot.tsx`

A single slot in the layout grid. It is simultaneously a **drop target** (accepts images from the gallery or other slots) and a **drag source** (allows rearranging images between slots).

**When empty:** Shows a "+" icon and "Drop an image here" text.

**When filled:** Shows the image at the specified zoom level with hover-reveal controls:
- **Clear button** (top-right) — Removes the image from the slot.
- **Zoom controls** (bottom-right) — Zoom in (＋), zoom out (－), and reset (shows current percentage like "100%").

**Drag-and-drop behavior:**
- Accepts `ItemTypes.ASSET` (from gallery) → calls `onDropAsset`
- Accepts `ItemTypes.SLOT` (from another slot) → calls `onMoveAsset` (swaps contents)
- Can be dragged if it contains an image → creates a `SLOT` drag item

### 8.5 LayoutSelector

**File:** `components/screen-mirroring/LayoutSelector.tsx`

A row of three toggle buttons representing layout types, each with a miniature grid icon:

- **Single** — One rectangle
- **Dual** — Two rectangles side by side
- **Quad** — Four rectangles in a 2×2 grid

The active layout is highlighted in purple. When the layout is not `empty`, a save preset button (download icon) appears after a divider.

### 8.6 PresetPanel & PresetItem

**File:** `components/screen-mirroring/PresetPanel.tsx` and `PresetItem.tsx`

**PresetPanel** fetches all saved presets from `GET /api/v1/images/presets` and renders them as a horizontally scrollable row. It re-fetches when `refreshKey` changes (after saving or deleting a preset). Uses optimistic UI deletion — removes the preset from the local list immediately, then calls the API.

**PresetItem** renders a 128×128px miniature preview of a saved layout:
- The grid structure matches the preset's `layout_type`.
- Each slot shows the corresponding image at its saved zoom level.
- Click loads the preset into the staging area.
- A hover-reveal delete button (×) in the top-right corner deletes the preset.

### 8.7 EditAssetModal

**File:** `components/screen-mirroring/EditAssetModal.tsx`

A modal dialog for editing an image's type/group classification. The DM can:
- Select an existing type from a dropdown populated by `GET /api/v1/images/types`.
- Create a new type by typing in a text input (takes priority over the dropdown).
- See a preview of the image being edited.

On save, the modal calls `PUT /api/v1/images/images/{id}` with the updated `type` field.

### 8.8 DraggableAsset & FilterPills

**DraggableAsset** (defined in `AssetPanel.tsx`) wraps an image thumbnail in a `react-dnd` drag source of type `ASSET`. It constructs the image URL from `API_BASE_URL/static/{file_path}` and passes `{ id, url }` as the drag item. Each thumbnail shows a hover-reveal edit button (tag icon) and the image type label.

**FilterPills** (defined in `AssetPanel.tsx`) fetches available types from the backend and renders "All" plus each type as horizontally scrollable pill buttons. Clicking a pill updates the active filter, which triggers the `AssetPanel` to re-fetch images with the `?type=` query parameter.

---

## 9. Drag-and-Drop System

### 9.1 Overview

The drag-and-drop system is built on `react-dnd` with the `HTML5Backend`. The `DndProvider` wraps the entire application in `AppRouter.tsx`, meaning drag-and-drop is available on all routes.

### 9.2 Item Types

Defined in `AssetPanel.tsx`:

```typescript
export const ItemTypes = {
    ASSET: 'asset',  // Image from the gallery
    SLOT: 'slot',    // Image being moved between slots
};
```

### 9.3 Drag Sources

| Source | Item Type | Item Shape | Component |
|--------|-----------|-----------|-----------|
| Gallery image | `ASSET` | `{ id: number, url: string }` | `DraggableAsset` |
| Filled slot image | `SLOT` | `{ sourceSlotId: number }` | `ImageSlot` (only when `slot.url` is non-null) |

### 9.4 Drop Targets

| Target | Accepted Types | Behavior |
|--------|---------------|----------|
| `ImageSlot` | `ASSET`, `SLOT` | If `ASSET`: places the image in this slot. If `SLOT`: swaps contents between source and target slots. |

Drop zones show visual feedback:
- **Active hover + can drop:** Purple ring (`ring-4 ring-arcane-purple`)
- **Can drop (not hovering):** Dashed faded ring (`ring-2 ring-dashed ring-faded-ink`)

---

## 10. State Management

### 10.1 Redux Store (Global State)

**File:** `app/store.ts`

The Redux store is configured with Redux Toolkit's `configureStore`. Two slices are relevant to Screen Mirroring:

```typescript
export const store = configureStore({
    reducer: {
        display: displayReducer,   // Player window's current layout
        images: imagesReducer,     // Global image library cache
        // ... other feature slices
    },
});
```

Typed hooks (`useAppDispatch`, `useAppSelector`) are defined in `app/hooks.ts` and used throughout the app.

### 10.2 displaySlice

**File:** `features/display/displaySlice.ts`

Manages the player window's display state:

```typescript
interface DisplayState {
    currentLayout: LayoutState | null;
}
```

| Action | Reducer | Description |
|--------|---------|-------------|
| `setCurrentLayout` | Sets `currentLayout` to the provided `LayoutState` | Used when `show_layout` is received |
| `clearLayout` | Sets `currentLayout` to `null` | Used when `clear_layout` is received |

This slice is **only used by the player window** (`PlayerDisplayPage`). The DM window uses local `useState` for its staging state.

### 10.3 imageSlice

**File:** `features/images/imageSlice.ts`

Manages the global image library:

```typescript
interface ImagesState {
    items: MediaAsset[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
}
```

| Thunk/Action | Description |
|-------------|-------------|
| `fetchImages` | Async thunk: `GET /api/v1/images/images` → updates `items` |

The `fetchImages` thunk is dispatched:
1. On `DmLayout` mount (initial load).
2. When a `images_updated` WebSocket event is received (library changed on disk).

**Note:** The `AssetPanel` component does **not** use this Redux state. It fetches its own asset list via local `useState` + `useEffect` with a `refreshKey` and `activeType` filter. The Redux `imageSlice` is used by other features (e.g., Dungeon Crawl's character photo picker) that need the full unfiltered list.

### 10.4 Local Component State

The `ScreenMirroringPage` uses `useState` for all staging state. This is intentional — the staging workflow is transient and page-specific, unlike the player's display state which must persist in Redux across re-renders.

The `AssetPanel` also uses local state for its asset list, type filter, editing modal, and refresh triggers. This keeps the panel self-contained and independently refreshable.

---

## 11. WebSocket Integration (Image Library Sync)

**File:** `layouts/DmLayout.tsx` and `hooks/useWebSocket.ts`

The WebSocket connection is established in `DmLayout` (the shell for all DM pages), not in the Screen Mirroring page specifically. This means image library updates are received regardless of which DM tab is active.

```
  Backend (fsnotify detects file change)
         │
         └── Broadcast: { type: "images_updated" }
                    │
                    ▼
  DmLayout.useWebSocket callback
         │
         └── dispatch(fetchImages())
                    │
                    ▼
  Redux imageSlice.items updated
```

**Connection lifecycle:**
- The `useWebSocket` hook opens a WebSocket to `ws://localhost:8080/ws` on mount and closes it on unmount.
- It parses incoming JSON messages and passes them to the `onMessage` callback.
- The callback is memoized with `useCallback` to prevent unnecessary WebSocket reconnections.

**Important:** The WebSocket is used **only** for backend-initiated events (image library changes). It is **not** used for DM-to-player display commands — those go through `BroadcastChannel`.

---

## 12. API Integration

All API calls use `axios` directly (there is no centralized API client for Screen Mirroring). The base URL comes from `config.ts`: `API_BASE_URL` (default: `http://localhost:8080`).

### 12.1 Image Library Endpoints

| Method | URL | Used In | Purpose |
|--------|-----|---------|---------|
| `GET` | `/api/v1/images/images` | `AssetPanel` (local), `imageSlice` (Redux) | Fetch all images, optionally filtered by `?type=` |
| `GET` | `/api/v1/images/types` | `FilterPills`, `EditAssetModal` | Get distinct type values for filter/edit dropdowns |
| `PUT` | `/api/v1/images/images/{id}` | `AssetPanel.handleSaveAsset` | Update an image's metadata (type) |

### 12.2 Preset Endpoints

| Method | URL | Used In | Purpose |
|--------|-----|---------|---------|
| `GET` | `/api/v1/images/presets` | `PresetPanel` | Fetch all saved preset layouts |
| `POST` | `/api/v1/images/presets` | `ScreenMirroringPage.handleSavePreset` | Save current layout as a preset |
| `DELETE` | `/api/v1/images/presets/{id}` | `ScreenMirroringPage.handleDeletePreset` | Delete a preset |

**Preset save format (sent to backend):**

```json
{
    "layout_type": "dual",
    "slots": [
        { "image_id": 1, "slot_id": 0, "zoom": 1.0 },
        { "image_id": 5, "slot_id": 1, "zoom": 1.5 }
    ]
}
```

Only filled slots (where both `url` and `imageId` are non-null) are included. Empty slots are omitted.

**Preset load conversion:** When loading a preset, the frontend converts `PresetLayout` (API format with nested `image` objects) back to `LayoutState` (local format with URLs). Image URLs are constructed as `API_BASE_URL/static/{file_path}`.

### 12.3 Upload Endpoint

| Method | URL | Used In | Purpose |
|--------|-----|---------|---------|
| `POST` | `/api/v1/images/upload` | `ScreenMirroringPage.handleFileUpload` | Upload an image file via multipart form |

The upload handler validates `file.type.startsWith('image/')` client-side before sending. After upload, the backend's filesystem watcher detects the new file, syncs the database, and broadcasts `images_updated` via WebSocket, which triggers the DM's image library to refresh automatically.

---

## 13. Custom Hooks

### 13.1 useBroadcastChannel

**File:** `hooks/useBroadcastChannel.ts`

Creates and manages a `BroadcastChannel` instance:

- **Input:** Channel name (`string`), message handler (`(message: BroadcastMessage) => void`)
- **Output:** The `BroadcastChannel` instance (for posting messages)
- **Lifecycle:** Creates the channel once (via `useMemo`), attaches the `onmessage` handler (via `useEffect`), cleans up on unmount.

### 13.2 useWebSocket

**File:** `hooks/useWebSocket.ts`

Creates and manages a native `WebSocket` connection:

- **Input:** WebSocket URL (`string`), message handler (`(message: any) => void`)
- **Output:** None (fire-and-forget connection)
- **Lifecycle:** Opens the connection on mount, parses incoming JSON, calls the handler. Closes on unmount. Logs connect, disconnect, and error events to the console.

### 13.3 useHorizontalScroll

**File:** `hooks/useHorizontalScroll.ts`

Converts vertical mouse wheel events into horizontal scrolling on a container:

- **Input:** None
- **Output:** A `ref` to attach to the scrollable container
- **Used by:** `AssetSelectionBar`, `FilterPills`, `PresetPanel` — all horizontally scrollable strips

---

## 14. TypeScript Types

**File:** `types/api.ts`

Screen Mirroring relevant types:

```typescript
export interface MediaAsset {
    ID: number;
    name: string;
    type: string;
    file_path: string;
}

export interface PresetLayoutSlot {
    ID: number;
    image_id: number;
    slot_id: number;
    zoom: number;
    image: MediaAsset;
}

export interface PresetLayout {
    ID: number;
    layout_type: 'single' | 'dual' | 'quad';
    slots?: PresetLayoutSlot[];
}
```

Additionally, layout-specific types are defined in `ScreenMirroringPage.tsx` and exported for use by child components and the player page:

- `LayoutType` — `'single' | 'dual' | 'quad'`
- `LayoutStatus` — `'empty' | 'staged' | 'live'`
- `ImageSlotState` — Per-slot state (slotId, url, zoom, imageId)
- `LayoutState` — Complete layout state (layout type, status, slots array)

---

## 15. Routing & Layouts

### 15.1 Route Structure

**File:** `routes/AppRouter.tsx`

```
/                  → DmLayout > ScreenMirroringPage (index)
/audio             → DmLayout > AudioPlayerPage
/crawl             → DmLayout > DungeonCrawlPage
/player            → PlayerDisplayPage (standalone, no DmLayout)
```

All DM pages are nested under `DmLayout` via React Router's `<Outlet>`. The player page is a standalone route with no layout wrapper — it renders fullscreen on a black background.

The entire route tree is wrapped in `DndProvider` with `HTML5Backend` for drag-and-drop support.

### 15.2 DmLayout

**File:** `layouts/DmLayout.tsx`

The shell layout for all DM-facing pages. It provides:

1. **Header** — DMD logo and "DM Dashboard" title.
2. **Outlet** — Renders the active page (`ScreenMirroringPage`, `AudioPlayerPage`, or `DungeonCrawlPage`).
3. **BottomNavBar** — Tab navigation between features.
4. **Initial data fetch** — Dispatches `fetchImages()` on mount.
5. **WebSocket connection** — Listens for `images_updated` events and re-fetches images.
6. **Spotify initialization** — Checks auth status and pre-warms the token (separate feature).

### 15.3 BottomNavBar

**File:** `components/layout/BottomNavBar.tsx`

A fixed-bottom navigation bar with three tabs:

| Tab | Route | Active Style |
|-----|-------|-------------|
| Screen Mirroring | `/` | Purple background |
| Audio Player | `/audio` | Purple background |
| Dungeon Crawl | `/crawl` | Purple background |

Uses React Router's `NavLink` with `isActive` for styling.

---

## 16. Styling & Theming

The application uses **Tailwind CSS** with a D&D-themed custom palette defined in `tailwind.config.js`:

| Color Token | Hex | Usage |
|-------------|-----|-------|
| `obsidian` | `#0d0b08` | Page backgrounds |
| `parchment` | `#e6d5b8` | Text and light elements |
| `leather-dark` | `#1a160f` | Card backgrounds, empty slots |
| `paladin-gold` | `#d8ae31` | Accent, live status borders, buttons |
| `arcane-purple` | `#8b5cf6` | Active states, staged borders, hover |
| `wax-red` | `#991b1b` | Close/hide buttons, warnings |
| `ink` | `#2c241a` | Dark text on gold backgrounds |
| `faded-ink` | `#6b5e4c` | Placeholder text, disabled states |

**Status visual encoding in the staging area:**

| Status | Border | Badge |
|--------|--------|-------|
| `empty` | Dashed, faded | Hidden |
| `staged` | Solid, purple | Purple "STAGED" |
| `live` | Solid, gold | Gold "LIVE" |

**Key CSS classes used across components:**
- `leather-card` — Custom class for card-like containers with a leather texture.
- `arcane-glow-hover` — Custom hover glow effect.
- `gold-gradient-text` — Gold gradient text for headers.
- `font-blackletter` — Cinzel font for D&D-style headings.
- `scrollbar-hide` — Hides scrollbars (from tailwind-scrollbar-hide plugin).

Conditional classes are applied via the `clsx` utility throughout the codebase.

---

## 17. Configuration

**File:** `config.ts`

```typescript
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
export const DEFAULT_PLAYER_WINDOW_IMG = '/party.jpeg';
```

Environment variables are defined in `.env`, `.env.local`, and `.env.production` files at the frontend root. The `REACT_APP_` prefix is required by Create React App.

---

## 18. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **BroadcastChannel for display sync** | Both windows are same-browser tabs. BroadcastChannel provides zero-latency, zero-network IPC — no server round-trip needed for display commands. |
| **WebSocket only for server events** | The backend WebSocket broadcasts `images_updated` when files change on disk. Display coordination doesn't involve the server, keeping the architecture simple. |
| **Local useState for staging state** | The DM's staging state is transient and page-specific. Putting it in Redux would add unnecessary indirection. Redux is used only for the player window's persistent display state. |
| **AssetPanel with independent data fetching** | The asset panel fetches its own filtered data via local state instead of using the Redux `imageSlice`. This enables per-component filtering, refresh, and avoids coupling the gallery to global state that other features also use. |
| **Module-scoped window reference** | `playerWindowRef` is stored outside the component so it survives React Router navigations. Module scope persists because SPA navigation doesn't reload the page. |
| **Sync-on-mount pattern** | When `ScreenMirroringPage` mounts, it immediately requests the player window's current state via BroadcastChannel. This handles the common case where the DM navigated away and came back — the staging area restores seamlessly. |
| **Player stores layout in Redux** | The player window needs to respond to sync requests even after the DM page unmounts/remounts. Redux state persists across the player's re-renders and the DM's navigations. |
| **DndProvider wraps entire app** | Placed in `AppRouter.tsx` rather than just the Screen Mirroring page because there is only one `DndProvider` allowed per React tree. This also enables future drag-and-drop in other features. |
| **Preset immutability** | Presets are saved and deleted but never edited. To change a preset, the DM loads it, modifies the staging area, and saves a new one. This matches the backend's design. |
| **Optimistic preset deletion** | `PresetPanel` removes the preset from its local list immediately on delete, before the API call completes. This provides instant feedback in a single-user desktop context where conflicts are impossible. |
| **Live update on zoom/move** | When the layout status is `live`, zoom changes and slot swaps are immediately broadcast to the player window. The DM sees real-time updates on the player display without needing to re-push. |
| **Named popup window** | `window.open` uses the name `'dmdPlayerWindow'`, ensuring repeated open calls reuse the same window instead of opening duplicates. |

---

## 19. Component Tree

Visual hierarchy of all components involved in the Screen Mirroring feature:

```
<Provider store={store}>                           [index.tsx]
  <BrowserRouter>                                  [index.tsx]
    <DndProvider backend={HTML5Backend}>            [AppRouter.tsx]
      <Routes>
        ┌── / ──► <DmLayout>                       [layouts/DmLayout.tsx]
        │           ├── useWebSocket (images_updated → fetchImages)
        │           ├── <header> "DM Dashboard"
        │           ├── <Outlet>
        │           │   └── <ScreenMirroringPage>   [pages/ScreenMirroringPage.tsx]
        │           │       ├── useBroadcastChannel('dmd-channel')
        │           │       ├── <ScreenMirroringToolbar>
        │           │       │   └── Open/Close, Show/Hide, Sync, Focus buttons
        │           │       ├── <AssetPanel>
        │           │       │   ├── Tab: Assets
        │           │       │   │   ├── <AssetSelectionBar>
        │           │       │   │   │   ├── <DraggableAsset> × N    (drag: ASSET)
        │           │       │   │   │   └── Browse button
        │           │       │   │   ├── <FilterPills>
        │           │       │   │   └── <EditAssetModal>   (conditional)
        │           │       │   └── Tab: Presets
        │           │       │       └── <PresetPanel>
        │           │       │           └── <PresetItem> × N
        │           │       ├── <input type="file" hidden>
        │           │       └── <StagingArea>
        │           │           ├── <LayoutSelector>       (single/dual/quad + save)
        │           │           ├── Status Badge
        │           │           ├── Notification Banner
        │           │           └── <ImageSlot> × 1|2|4    (drop: ASSET+SLOT, drag: SLOT)
        │           └── <BottomNavBar>
        │
        └── /player ──► <PlayerDisplayPage>         [pages/PlayerDisplayPage.tsx]
                          ├── BroadcastChannel('dmd-channel')
                          ├── Redux: state.display.currentLayout
                          └── Renders: default image OR dynamic grid
      </Routes>
    </DndProvider>
  </BrowserRouter>
</Provider>
```

---

## 20. Legacy / Unused Code

**File:** `components/dm/DmToolbar.tsx`

This was the original prototype toolbar for the Screen Mirroring feature. It posts a `show_image` message type with a hardcoded goblin image — a message type that `PlayerDisplayPage` does **not** handle. Nothing currently imports or renders this component. It has been superseded by `ScreenMirroringToolbar`.

---

## 21. Dependencies

Screen Mirroring relevant dependencies from `package.json`:

| Package | Version | Role |
|---------|---------|------|
| `react` | ^18.3.1 | UI framework |
| `react-dom` | ^18.3.1 | DOM rendering |
| `react-router-dom` | ^6.25.1 | Client-side routing (DmLayout, /player route) |
| `@reduxjs/toolkit` | ^2.2.6 | State management (displaySlice, imageSlice) |
| `react-redux` | ^9.1.2 | React bindings for Redux |
| `react-dnd` | ^16.0.1 | Drag-and-drop framework |
| `react-dnd-html5-backend` | ^16.0.1 | HTML5 drag-and-drop backend |
| `axios` | ^1.7.2 | HTTP client for API calls |
| `clsx` | ^2.1.1 | Conditional CSS class utility |
| `tailwind-merge` | ^2.4.0 | Tailwind class deduplication |
| `tailwind-scrollbar-hide` | ^4.0.0 | Hide scrollbars CSS plugin |
| `lucide-react` | ^0.412.0 | Icon library (used in other features, available here) |
| `typescript` | ^5.5.4 | TypeScript compiler |
| `react-scripts` | 5.0.1 | Create React App build tooling |
