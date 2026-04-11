# Dungeon Crawl — Frontend Architecture

## Table of Contents

- [Overview](#overview)
- [Architecture Diagram](#architecture-diagram)
- [State Management (Redux)](#state-management-redux)
  - [State Shape](#state-shape)
  - [Async Thunks](#async-thunks)
  - [Sync Reducers](#sync-reducers)
- [Page Structure](#page-structure)
- [Component Hierarchy](#component-hierarchy)
- [Component Catalog](#component-catalog)
- [Drag and Drop](#drag-and-drop)
- [Type System](#type-system)
- [Data Flow Walkthroughs](#data-flow-walkthroughs)
  - [Loading Templates](#loading-templates)
  - [Adding a Combatant to Battle](#adding-a-combatant-to-battle)
  - [Combat Turn Cycle](#combat-turn-cycle)
  - [HP and Death Mechanics](#hp-and-death-mechanics)
- [Design Decisions](#design-decisions)
- [File Index](#file-index)

---

## Overview

The Dungeon Crawl frontend is a React single-page feature that provides two major sections:

1. **Character Bank** — a persistent library of character templates (PCs and monsters) backed by the Go REST API. Templates are fetched, created, updated, and deleted via async Redux thunks.
2. **Active Battle** — an ephemeral, client-only combat tracker managed entirely in Redux. Combatants are created from templates, assigned initiative, and tracked with live HP, status effects, spell/rage slot usage, death saves, and turn order.

Combat state is **not persisted** — it lives only in Redux and is lost on page refresh.

The UI uses a "High Fantasy Manuscript" aesthetic with Tailwind CSS, custom fonts (Cinzel, Newsreader, MedievalSharp), and SVG icons for game elements.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Frontend (React)                           │
│                                                                     │
│  ┌─────────────────────────┐    ┌────────────────────────────────┐  │
│  │     Character Bank      │    │       Active Battle            │  │
│  │  (persistent templates) │    │   (ephemeral combat state)     │  │
│  │                         │    │                                │  │
│  │  BankToolbar            │    │  BattleToolbar                 │  │
│  │  BankGrid               │    │  CombatantRow                  │  │
│  │    └─ CreatureCard×N    │    │    └─ CreatureCard×N           │  │
│  │  TemplateFormModal      │    │  StatusEffectPicker            │  │
│  └────────────┬────────────┘    └───────────────┬────────────────┘  │
│               │                                 │                   │
│               ▼                                 ▼                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Redux (crawlSlice)                        │   │
│  │  templates[] ← API    combatants[] ← local only             │   │
│  │  status, error         activeTurnIndex, round                │   │
│  │  pcSearchQuery         spellSlotUsage, rageSlotUsage         │   │
│  │  monsterSearchQuery    statusEffects, deathSaves             │   │
│  └─────────────────────────────┬────────────────────────────────┘   │
│                                │ (async thunks for templates only)  │
└────────────────────────────────┼────────────────────────────────────┘
                                 │ HTTP
                                 ▼
                    Backend REST API (Go)
```

---

## State Management (Redux)

**File:** `frontend/src/features/crawl/crawlSlice.ts`

The crawl Redux slice (`state.crawl`) manages both persistent template data and ephemeral combat state.

### State Shape

```typescript
interface CrawlState {
    // Server-backed (persisted via API)
    templates: CharacterTemplate[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    pcSearchQuery: string;
    monsterSearchQuery: string;

    // Client-only (ephemeral combat state)
    combatants: Combatant[];
    activeTurnIndex: number;  // -1 = no active turn
    round: number;            // 0 = no combat
}
```

### Async Thunks

Template CRUD — these hit the backend API:

| Thunk | HTTP Method | Endpoint |
|-------|------------|----------|
| `fetchTemplates` | GET | `/api/v1/crawl/templates` |
| `createTemplate` | POST | `/api/v1/crawl/templates` |
| `updateTemplate` | PUT | `/api/v1/crawl/templates/{id}` |
| `deleteTemplate` | DELETE | `/api/v1/crawl/templates/{id}` |
| `uploadTemplatePhoto` | POST | `/api/v1/crawl/templates/{id}/photo` |

Only `fetchTemplates` has full pending/rejected handling in `extraReducers`. Other thunks update state on fulfilled only.

### Sync Reducers

Combat actions — all client-side, no API calls:

| Action | Payload | Behavior |
|--------|---------|----------|
| `addCombatant` | `{ template, initiative }` | Creates a `Combatant` from template data, assigns UUID via `crypto.randomUUID()`, copies HP/AC, initializes spell/rage slot usage arrays from template slots, sorts all combatants by initiative desc. Sets `activeTurnIndex=0` and `round=1` on first combatant. |
| `removeCombatant` | `instanceId` | Removes combatant, adjusts turn index (decrements if removed combatant was before active, wraps if at end). |
| `adjustHp` | `{ instanceId, delta }` | Skips if dead or in death save. Clamps HP to [0, maxHP]. At 0: clears status effects; PCs enter death save, monsters die instantly. |
| `addStatusEffect` | `{ instanceId, effect }` | Adds effect if not immune (checks template's `immunities` array) and not already applied. |
| `removeStatusEffect` | `{ instanceId, effect }` | Removes a status effect from the combatant. |
| `adjustDeathSave` | `{ instanceId, delta }` | Only works on combatants in death save state. Clamps count to [-3, 3]. At +3: stabilize (1 HP, exit death save). At -3: permanent death, clear status effects. |
| `reviveCombatant` | `instanceId` | Revives dead combatant to 1 HP, clears death save state. |
| `nextTurn` | none | Advances turn index, skipping dead combatants. Increments round when index wraps to ≤ previous position. |
| `toggleSlot` | `{ instanceId, slotType, level, slotIndex }` | Toggles individual spell/rage slot used state (boolean flip). |
| `clearAll` | none | Clears all combatants, resets turn index to -1 and round to 0. |
| `setPcSearchQuery` | `string` | Sets PC bank search filter. |
| `setMonsterSearchQuery` | `string` | Sets monster bank search filter. |

**Exported helper:**
- `selectTemplateForCombatant(templates, templateId)` — finds a template by ID. Used by `CombatantRow` and `BattleToolbar`.

---

## Page Structure

**File:** `frontend/src/pages/DungeonCrawlPage.tsx`

The page is the top-level orchestrator. It manages two pieces of local state:
- `initiativeTarget: CharacterTemplate | null` — when set, shows the initiative modal
- `viewingTemplate: CharacterTemplate | null` — when set, shows the character view modal

Layout (top to bottom):
1. **BattleSection** — active combat area (drop target)
2. Flourish divider (decorative)
3. **CharacterBank** — PC and monster template banks side by side

The page also renders shared modals: `InitiativeModal` and `CharacterViewModal`.

**Routing:** Mounted at `/crawl` under `DmLayout` (defined in `frontend/src/routes/AppRouter.tsx`). The bottom nav bar links to it as "Dungeon Crawl".

---

## Component Hierarchy

```
DungeonCrawlPage
├── BattleSection (useDrop target)
│   ├── BattleToolbar (Next Turn, Clear All, round/turn info)
│   └── CombatantRow (horizontal scroll)
│       └── CreatureCard (mode="combat") ×N
│           └── StatusEffectPicker (portal)
├── CharacterBank
│   ├── BankToolbar (search + "New PC/Monster" button) ×2
│   ├── BankGrid ×2
│   │   └── CreatureCard (mode="bank") ×N
│   └── TemplateFormModal (create/edit)
├── InitiativeModal
└── CharacterViewModal
```

---

## Component Catalog

### CreatureCard

**File:** `components/crawl/CreatureCard.tsx`

The unified card component, used in both bank and combat modes via a `mode: 'bank' | 'combat'` prop. Uses `forwardRef` (needed for combat scroll-into-view) and always calls `useDrag` (React hooks rules — drag ref only attached in bank mode).

| Feature | Bank Mode | Combat Mode |
|---------|-----------|-------------|
| Card size | `w-48 h-80` | `w-48 h-80` |
| Image area | Flex-grow with fade gradient | Same |
| Initiative icon | Empty d20 (no number) | d20 with initiative value |
| HP display | `maxHP/maxHP` (always full) | `hp/maxHP` (live) |
| Health bar | Always 100% green | Color-coded by HP ratio |
| HP buttons | Hidden | `-10, -5, -1, +1` pill buttons |
| Status effects | Hidden | Picker + floating labels |
| Spell/rage slots | Static display (non-interactive) | Toggleable (click to use/restore) |
| Death/death save overlays | N/A | Shown when applicable |
| Hover buttons | Edit + Delete | Remove from battle |
| Drag & drop | Drag source | Not draggable |
| Double-click | Opens initiative modal | N/A |
| Active turn highlight | N/A | Gold outline + scale |

Contains private SVG icon sub-components: `HpIcon`, `AcIcon`, `InitIcon`, `StatsIcon`, `StatusEffectIcon`, `SpellSlotIcon`, `RageSlotIcon`.

### BattleSection

**File:** `components/crawl/BattleSection.tsx`

`useDrop` wrapper accepting `BANK_CHARACTER` drag type. On drop, calls `onRequestInitiative(template)`. Renders `BattleToolbar` and `CombatantRow` with a dimmed dragon logo watermark.

### BattleToolbar

**File:** `components/crawl/BattleToolbar.tsx`

Displays round number and active combatant name (via `selectTemplateForCombatant`). Provides "Next Turn" and "Clear All" (with confirmation) buttons.

### CombatantRow

**File:** `components/crawl/CombatantRow.tsx`

Reads `combatants`, `templates`, and `activeTurnIndex` from Redux. Performs template lookup for each combatant. Renders `CreatureCard` in combat mode with refs for `scrollIntoView` on active turn change. Tracks duplicate template counts for `showCopyIndex`.

### CharacterBank

**File:** `components/crawl/CharacterBank.tsx`

Dispatches `fetchTemplates` on mount when `status === 'idle'`. Manages `TemplateFormModal` state (create/edit). Renders two side-by-side sections (PC and Monster), each with a `BankToolbar` and `BankGrid`.

### BankGrid

**File:** `components/crawl/BankGrid.tsx`

Filters `templates` from Redux by `character_type` and the corresponding search query. Renders `CreatureCard` in bank mode for each filtered template.

### BankToolbar

**File:** `components/crawl/BankToolbar.tsx`

Search input dispatching `setPcSearchQuery` / `setMonsterSearchQuery`. "New PC" / "New Monster" button.

### TemplateFormModal

**File:** `components/crawl/TemplateFormModal.tsx`

Large create/edit form covering all `CharacterTemplate` fields. Notable features:
- Image picker showing images from the backend `imageSlice`
- Drag-to-adjust photo preview (vertical `object-position` offset stored as `photo_offset_y`)
- Slot editors for spell and rage slots (add/remove levels, adjust counts)
- Immunity multiselect
- Color picker for card background

### InitiativeModal

**File:** `components/crawl/InitiativeModal.tsx`

Simple stepper for initiative score (default 10). Has `±1` and `±5` buttons. Calls `onConfirm(template, initiative)`.

### CharacterViewModal

**File:** `components/crawl/CharacterViewModal.tsx`

Read-only stat sheet displaying all *set* fields from a `CharacterTemplate`. Sections: combat stats, speeds, ability scores (2×3 grid), skills, saving throws (filtered to non-zero), immunities, damage relations, languages, senses, actions, reactions, features. Parchment-styled with character portrait to the right. Rendered at page level to avoid `transform` containment issues.

### StatusEffectPicker

**File:** `components/crawl/StatusEffectPicker.tsx`

Portal-based dropdown (`createPortal` into `document.body`) listing all 15 D&D status effects (Blinded through Unconscious). Disables already-applied and immune effects. Positioned dynamically relative to its anchor button. Uses portal rendering to avoid z-index clipping from card `overflow: hidden`.

---

## Drag and Drop

**File:** `components/crawl/dndTypes.ts`

```typescript
export const DND_TYPES = {
    BANK_CHARACTER: 'BANK_CHARACTER',
} as const;
```

- **Drag source:** `CreatureCard` in bank mode emits `{ type: BANK_CHARACTER, item: { template } }` via `useDrag`.
- **Drop target:** `BattleSection` accepts `BANK_CHARACTER` and calls `onRequestInitiative(item.template)`.
- The `DndProvider` with `HTML5Backend` wraps all routes in `AppRouter.tsx` (shared with the screen mirroring feature's asset drag-and-drop).

Double-clicking a bank card also triggers `onRequestInitiative` as an alternative to drag-and-drop.

---

## Type System

**File:** `frontend/src/types/api.ts`

### Core Types

| Type | Purpose |
|------|---------|
| `CharacterTemplate` | Mirrors the backend model. All fields for a character's full stat sheet. Has `ID: number` (from GORM). |
| `Combatant` | Frontend-only type for a character instance in active combat. Created from a template when added to battle. |
| `StatusEffect` | Union type of 15 D&D conditions (`'Blinded' | 'Charmed' | ...`). Derived from `STATUS_EFFECTS` const array. |
| `ResourceSlot` | `{ level: number, count: number }` — defines slot configuration on a template. |
| `SlotUsage` | `{ level: number, total: number, usedSlots: boolean[] }` — runtime tracking of individual slot usage on a combatant. Created from `ResourceSlot` when `addCombatant` fires. |

### Character Sheet Sub-types

| Type | Purpose |
|------|---------|
| `AbilityScore` | `{ score: number, modifier: number }` |
| `AbilityScores` | Six abilities: strength, dexterity, constitution, intelligence, wisdom, charisma |
| `SkillScores` | All 18 D&D skills as numeric values |
| `SavingThrow` | `{ ability: string, value: number }` |
| `DamageRelation` | `{ damage_type: string, relation: 'immune' | 'vulnerable', custom_text?: string }` |
| `LanguageEntry` | `{ language: string, proficiency: 'understand' | 'speak', custom_text?: string }` |
| `SenseEntry` | `{ sense: string, custom_text?: string }` |
| `NamedEntry` | `{ name: string, description: string }` — used for Actions, Reactions, Features |

### Status Effect Colors

**File:** `components/crawl/statusEffects.ts`

Exports `STATUS_EFFECT_COLORS: Record<StatusEffect, string>` — a hex color per condition. Used for card border glows, floating effect labels, and the status effect picker pills.

---

## Data Flow Walkthroughs

### Loading Templates

1. `CharacterBank` mounts → checks `state.crawl.status === 'idle'`
2. Dispatches `fetchTemplates()` thunk → `GET /api/v1/crawl/templates`
3. Backend responds with `CharacterTemplate[]`
4. Redux: `state.crawl.templates` updated, `status = 'succeeded'`
5. `BankGrid` reads templates via `useAppSelector`, filters by `character_type` + search query
6. Renders `CreatureCard` in bank mode for each filtered template

### Adding a Combatant to Battle

1. User drags a `CreatureCard` from bank → drops on `BattleSection`, **OR** double-clicks the card
2. `BattleSection.onDrop` / `CreatureCard.onDoubleClick` → calls `onRequestInitiative(template)`
3. `DungeonCrawlPage` sets `initiativeTarget` state → renders `InitiativeModal`
4. User sets initiative score → clicks confirm → `onConfirm(template, initiative)`
5. Page dispatches `addCombatant({ template, initiative })`
6. Reducer:
   - Creates `Combatant` with `crypto.randomUUID()` as `instanceId`
   - Copies `max_hp`, `ac` from template
   - Calculates `copyIndex` (for duplicate tracking)
   - Initializes `spellSlotUsage` / `rageSlotUsage` from template's `spell_slots` / `rage_slots`
   - Sorts all combatants by initiative descending
   - If first combatant: `activeTurnIndex = 0`, `round = 1`
7. `CombatantRow` re-renders with the new combatant as a `CreatureCard` in combat mode

### Combat Turn Cycle

1. `BattleToolbar` shows current round number and active combatant name
2. DM clicks "Next Turn" → dispatches `nextTurn`
3. Reducer advances `activeTurnIndex`:
   - Skips dead combatants (`isDead === true`)
   - If index wraps to ≤ previous position, `round` increments
4. `CombatantRow` effect fires: scrolls the active card into view via `ref.scrollIntoView({ inline: 'center', behavior: 'smooth' })`
5. Active card renders with gold outline (`outline-paladin-gold`) and slight scale-up

### HP and Death Mechanics

1. DM clicks HP adjustment button (e.g., `-5`) → dispatches `adjustHp({ instanceId, delta: -5 })`
2. Reducer:
   - Skips if combatant `isDead` or `isInDeathSave`
   - Clamps HP to `[0, max_hp]`
   - If HP reaches 0:
     - Clears all status effects
     - **PC** (`character_type === 'pc'`): enters death save state (`isInDeathSave = true`, `deathSaveCount = 0`)
     - **Monster**: dies instantly (`isDead = true`)
3. Death save UI: card shows overlay with `±1` buttons
4. `adjustDeathSave` tracks counter `[-3, +3]`:
   - At `+3`: stabilize → `hp = 1`, exits death save
   - At `-3`: permanent death → `isDead = true`
5. Dead combatants: card shows skull overlay with "Revive" button (visible on hover)
6. Dead combatants are automatically skipped by `nextTurn`
7. `reviveCombatant` restores a dead combatant to 1 HP

---

## Design Decisions

1. **Ephemeral combat state.** Combat lives only in Redux — no server persistence. This keeps the backend simple and avoids complex session management. The tradeoff is that combat state is lost on page refresh.

2. **Unified `CreatureCard` component.** A single component with a `mode` prop (`bank` | `combat`) renders both bank and battle cards. This prevents visual drift between the two views and reduces code duplication. Mode-specific sections (HP buttons, slot toggles, death overlays) are conditionally rendered.

3. **Template-as-prototype pattern.** The bank stores templates; adding to combat creates a *copy* (`Combatant`) with its own mutable state. The original template remains unchanged in Redux. Multiple copies of the same template can exist in battle (tracked by `copyIndex`, displayed as `#2`, `#3`, etc.).

4. **Portal-based modals.** `StatusEffectPicker` and `CharacterViewModal` use `createPortal` to render into `document.body`. This avoids z-index and `overflow: hidden` clipping issues caused by CSS `transform` on parent card elements (which creates a new stacking context).

5. **`useDrag` always called.** React hooks can't be conditional. `CreatureCard` always calls `useDrag`, but only attaches the drag ref to the DOM in bank mode. In combat mode the ref is unused.

6. **Template lookup in parent.** `CombatantRow` performs the template lookup for each combatant (via `selectTemplateForCombatant`) and passes the resolved `template` as a prop to `CreatureCard`. This keeps the card component free of Redux selectors for template resolution.

---

## File Index

| File | Description |
|------|-------------|
| `frontend/src/pages/DungeonCrawlPage.tsx` | Page orchestrator |
| `frontend/src/features/crawl/crawlSlice.ts` | Redux slice (templates + combat state) |
| `frontend/src/types/api.ts` | TypeScript types (`CharacterTemplate`, `Combatant`, etc.) |
| `frontend/src/components/crawl/CreatureCard.tsx` | Unified card component (bank + combat modes) |
| `frontend/src/components/crawl/BattleSection.tsx` | Drop target wrapper for combat area |
| `frontend/src/components/crawl/BattleToolbar.tsx` | Turn/round controls |
| `frontend/src/components/crawl/CombatantRow.tsx` | Horizontal combatant scroll with auto-center |
| `frontend/src/components/crawl/CharacterBank.tsx` | Bank container (PC + monster sections) |
| `frontend/src/components/crawl/BankGrid.tsx` | Filtered card grid |
| `frontend/src/components/crawl/BankToolbar.tsx` | Search + new character button |
| `frontend/src/components/crawl/TemplateFormModal.tsx` | Character create/edit form |
| `frontend/src/components/crawl/InitiativeModal.tsx` | Initiative score input |
| `frontend/src/components/crawl/CharacterViewModal.tsx` | Read-only stat sheet viewer |
| `frontend/src/components/crawl/StatusEffectPicker.tsx` | Status effect dropdown (portal) |
| `frontend/src/components/crawl/dndTypes.ts` | Drag-and-drop type constants |
| `frontend/src/components/crawl/statusEffects.ts` | Status effect color map |
| `frontend/src/routes/AppRouter.tsx` | Route definition (`/crawl` → `DungeonCrawlPage`) |
| `frontend/src/app/store.ts` | Redux store (`crawl: crawlReducer`) |
