# Dungeon Crawl — Backend Architecture

## Table of Contents

- [Overview](#overview)
- [Architecture Diagram](#architecture-diagram)
- [Data Model](#data-model)
- [Repository Layer](#repository-layer)
- [Handler Layer](#handler-layer)
- [Route Registration](#route-registration)
- [API Surface](#api-surface)
- [Database & Migrations](#database--migrations)
- [JSON Column Pattern](#json-column-pattern)
- [Design Decisions](#design-decisions)
- [File Index](#file-index)

---

## Overview

The backend scope for Dungeon Crawl is a CRUD REST API for `CharacterTemplate` records, with an additional endpoint for photo uploads. It is built in Go using Gorilla Mux for routing and GORM for ORM/SQLite persistence.

There is **no service layer** — handlers interact with the repository directly. There is **no server-side combat state** — all active battle tracking (initiative, HP, status effects, turns) is handled entirely by the frontend in Redux.

The backend's responsibilities are:
1. Persist character templates (PCs and monsters) with full D&D stat sheets
2. Handle CRUD operations on those templates
3. Accept and serve template photo uploads

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       Backend (Go)                              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Routes (/api/v1/crawl/templates)                         │  │
│  │    ├─ CharacterTemplateHandler  (GET/POST/PUT/DELETE)     │  │
│  │    └─ CharacterTemplatePhotoHandler (POST .../photo)      │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────┼────────────────────────────────┐  │
│  │  Repository (CharacterTemplateRepository)                 │  │
│  │    GetByID, GetAll, Create, Update, Delete                │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────┼────────────────────────────────┐  │
│  │  SQLite (GORM)                                            │  │
│  │    character_templates table                              │  │
│  │    JSON columns for complex fields (abilities, etc.)      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

**File:** `backend/internal/model/crawl/character_template.go`

The `CharacterTemplate` struct is the central persistence model. It embeds `gorm.Model` (which provides `ID`, `CreatedAt`, `UpdatedAt`, `DeletedAt` for soft deletes).

| Field Group | Fields | Storage |
|-------------|--------|---------|
| **Identity** | `Name`, `CharacterType` (pc/monster), `CreatureType`, `CreatureTypeCustom`, `Race`, `Class`, `Alignment`, `Size`, `PhotoPath`, `PhotoOffsetY`, `Color` | Plain columns |
| **Core Stats** | `Level`, `HP`, `MaxHP`, `AC`, `ProficiencyBonus`, `HitDice`, `SpellSlots`, `RageSlots` | Plain columns + JSON TEXT for slots |
| **Speeds** | `Speed`, `BurrowSpeed`, `ClimbSpeed`, `FlySpeed`, `SwimSpeed` | Plain columns |
| **Complex Data** | `Abilities`, `SavingThrows`, `Skills`, `Immunities`, `DamageRelations`, `Languages`, `Senses`, `Actions`, `Reactions`, `OtherFeatures` | JSON TEXT columns |
| **Extensibility** | `CustomFields` | `datatypes.JSON` (arbitrary JSON) |

**Design note:** The model is intentionally wide to accommodate the full D&D 5e character sheet. New fields can be added to any group, and `CustomFields` exists for ad-hoc data that doesn't warrant a dedicated column.

---

## Repository Layer

**Interface:** `backend/internal/platform/storage/repos/repository.go`

```go
type CharacterTemplateRepository interface {
    GetByID(id uint) (*crawl.CharacterTemplate, error)
    GetAll(filters filters.CharacterTemplateFilters) ([]*crawl.CharacterTemplate, error)
    Create(tmpl *crawl.CharacterTemplate) error
    Update(tmpl *crawl.CharacterTemplate) error
    Delete(id uint) error
}
```

**Implementation:** `backend/internal/platform/storage/repos/character_template_repo/character_template_repo.go`

Standard GORM implementation. `GetAll` supports optional filtering by `name` (LIKE) and `character_type`, plus optional pagination via `page` and `pageSize`.

`Delete` uses GORM's soft delete (the model embeds `gorm.Model` which has `DeletedAt`).

**Filter struct:** `backend/internal/api/common/filters/filters.go`

```go
type CharacterTemplateFilters struct {
    Name          string
    CharacterType string
    Page          int
    PageSize      int
}
```

---

## Handler Layer

Two handlers serve the crawl API:

**1. `CharacterTemplateHandler`** (`backend/internal/api/handlers/crawl/character_template_handler.go`)

Handles all CRUD operations for templates:

| Method | Behavior |
|--------|----------|
| `GET` (no id) | List all templates with optional query filters (`name`, `character_type`, `page`, `pageSize`) |
| `GET` (with id) | Get a single template by ID |
| `POST` | Create a new template from JSON body |
| `PUT` | Update an existing template by ID |
| `DELETE` | Soft-delete a template by ID |

The handler distinguishes between list and get-by-ID based on whether `{id}` is present in the mux route vars.

**2. `CharacterTemplatePhotoHandler`** (`backend/internal/api/handlers/crawl/character_template_photo_handler.go`)

Handles photo uploads for templates:

- Accepts `POST` with multipart form data (`photo` field, max 10MB)
- Validates content type (jpeg, png, gif, webp only)
- Saves to `{assetsPath}/images/templates/template_{id}{ext}`
- Removes old photo if extension changed
- Updates `PhotoPath` on the template record

Both handlers create their own `CharacterTemplateRepository` instance from `RoutingServices.DbConnection` — there is no shared service layer or dependency injection container for crawl.

---

## Route Registration

**Files:** `backend/internal/api/routes/apiRoutes.go` and `backend/internal/api/routes/router.go`

Template CRUD routes are registered in `apiRoutes.go`:

```go
newRouteDetails("/crawl/templates", crawl.NewCharacterTemplateHandler),
newRouteDetails("/crawl/templates/{id}", crawl.NewCharacterTemplateHandler),
```

The photo upload route is registered separately in `router.go`:

```go
photoHandler := crawl.NewCharacterTemplatePhotoHandler(rs, rs.Log, staticAssetsPath)
apiV1.HandleFunc("/crawl/templates/{id}/photo", photoHandler.Post).Methods("POST")
```

**Middleware** (applied globally, not crawl-specific):
- `middleware.Recovery(log)` — panic recovery
- `middleware.Logging(log)` — request logging

**Dependency wiring:** `RoutingServices` (defined in `backend/internal/api/common/types.go`) holds `Log`, `DbConnection`, `WsManager`, `ImageService`, `PdfService`, `SpotifyService`. Crawl handlers only use `DbConnection` and `Log`. The photo handler additionally receives `staticAssetsPath` from the router.

---

## API Surface

All endpoints are under the `/api/v1` prefix:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/crawl/templates` | List templates (optional query: `name`, `character_type`, `page`, `pageSize`) |
| `POST` | `/api/v1/crawl/templates` | Create template |
| `GET` | `/api/v1/crawl/templates/{id}` | Get template by ID |
| `PUT` | `/api/v1/crawl/templates/{id}` | Update template |
| `DELETE` | `/api/v1/crawl/templates/{id}` | Delete template (soft) |
| `POST` | `/api/v1/crawl/templates/{id}/photo` | Upload template photo (multipart, field: `photo`) |

Photos are served statically via `/static/images/templates/template_{id}.{ext}`.

---

## Database & Migrations

**File:** `backend/internal/platform/storage/database.go`

GORM `AutoMigrate` includes `&crawl.CharacterTemplate{}`, which creates/updates the `character_templates` table on startup. There is also a legacy one-time migration that renames `type` → `character_type`.

The database is SQLite (`dmd.db`).

---

## JSON Column Pattern

**File:** `backend/internal/model/crawl/character_sheet_types.go`

Complex fields (ability scores, skills, saving throws, etc.) are stored as JSON TEXT in SQLite using the generic `jsonColumn[T]` wrapper:

```go
type jsonColumn[T any] struct {
    Data T
}
```

This type implements:
- `driver.Valuer` — marshals `Data` to JSON for writes
- `sql.Scanner` — unmarshals JSON from reads, with legacy tolerance for plain numeric values (from before `spell_slots`/`rage_slots` were changed from integers to JSON arrays)
- `json.Marshaler` / `json.Unmarshaler` — for HTTP JSON serialization

Concrete type aliases used by `CharacterTemplate`:

| Alias | Underlying Type |
|-------|----------------|
| `AbilityScoresColumn` | `jsonColumn[AbilityScores]` |
| `SkillScoresColumn` | `jsonColumn[SkillScores]` |
| `SavingThrowsColumn` | `jsonColumn[[]SavingThrow]` |
| `ImmunitiesColumn` | `jsonColumn[[]string]` |
| `DamageRelationsColumn` | `jsonColumn[[]DamageRelation]` |
| `LanguagesColumn` | `jsonColumn[[]LanguageEntry]` |
| `SensesColumn` | `jsonColumn[[]SenseEntry]` |
| `NamedEntriesColumn` | `jsonColumn[[]NamedEntry]` |
| `ResourceSlotsColumn` | `jsonColumn[[]ResourceSlot]` |

D&D sub-types defined in the same file:

| Type | Purpose |
|------|---------|
| `AbilityScore` | Single ability (`Score`, `Modifier`) |
| `AbilityScores` | All six core abilities (STR, DEX, CON, INT, WIS, CHA) |
| `SkillScores` | All 18 D&D skills |
| `SavingThrow` | Ability name + value pair |
| `DamageRelation` | Damage type + relation (immune/vulnerable) + optional custom text |
| `LanguageEntry` | Language + proficiency (understand/speak) + optional custom text |
| `SenseEntry` | Sense name + optional custom text |
| `NamedEntry` | Generic name + description pair (used for Actions, Reactions, Features) |
| `ResourceSlot` | `Level` + `Count` (used for spell slots and rage slots) |

---

## Design Decisions

1. **No service layer.** Handlers interact directly with the repository. This is appropriate given the straightforward CRUD nature — there's no business logic that warrants a dedicated service.

2. **No server-side combat state.** All active battle tracking is handled by the frontend in Redux. This keeps the backend simple and avoids complex session management.

3. **JSON columns for complex D&D data.** Rather than normalizing abilities, skills, saves, etc. into separate tables, they're stored as JSON TEXT in SQLite. This simplifies the schema and avoids joins, at the cost of not being queryable at the field level. The generic `jsonColumn[T]` wrapper handles serialization uniformly.

4. **Wide model with `CustomFields`.** The `CharacterTemplate` model is intentionally wide to accommodate the full D&D 5e character sheet. `CustomFields` (`datatypes.JSON`) provides an escape hatch for ad-hoc data.

5. **Soft deletes.** Templates use GORM's built-in soft delete via `gorm.Model.DeletedAt`. This allows recovery and prevents orphaned references.

6. **Photo storage on filesystem.** Template photos are saved to the filesystem under `{assetsPath}/images/templates/` and served via the static file server at `/static/`. The `PhotoPath` column stores the relative path.

---

## File Index

| File | Description |
|------|-------------|
| `backend/internal/model/crawl/character_template.go` | `CharacterTemplate` GORM model |
| `backend/internal/model/crawl/character_sheet_types.go` | JSON column wrapper, D&D sub-types (abilities, skills, etc.) |
| `backend/internal/platform/storage/repos/repository.go` | `CharacterTemplateRepository` interface |
| `backend/internal/platform/storage/repos/character_template_repo/character_template_repo.go` | GORM implementation of the repository |
| `backend/internal/api/handlers/crawl/character_template_handler.go` | CRUD handler for templates |
| `backend/internal/api/handlers/crawl/character_template_photo_handler.go` | Photo upload handler |
| `backend/internal/api/common/filters/filters.go` | `CharacterTemplateFilters` struct |
| `backend/internal/api/routes/apiRoutes.go` | Route table (includes crawl template routes) |
| `backend/internal/api/routes/router.go` | Router setup (includes photo route registration) |
| `backend/internal/platform/storage/database.go` | AutoMigrate includes `CharacterTemplate` |
