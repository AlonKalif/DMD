### Core Development Principles

#### 1. **SOLID Principles**

**Single Responsibility Principle (SRP)**:
- Each handler manages one resource type (images, characters, NPCs, etc.)
- Services have focused responsibilities (Spotify, image sync, WebSocket)
- Components render single UI concerns

**Open/Closed Principle (OCP)**:
- Handlers extend `BaseHandler` with default 405 implementations
- Repository interfaces allow implementation swapping
- Redux slices are independent, composable modules

**Liskov Substitution Principle (LSP)**:
- All handlers implement `IHandler` interface
- Repository implementations satisfy their contracts

**Interface Segregation Principle (ISP)**:
- Domain-specific repository interfaces (ImagesRepository, CharacterRepository, etc.)
- Components receive only the props they need

**Dependency Inversion Principle (DIP)**:
- Handlers depend on repository interfaces, not concrete implementations
- Services injected via `RoutingServices` struct
- Redux hooks abstract store access

#### 2. **Modularity**
- Domain-driven structure (images, audio, characters, combat)
- Feature-based Redux slices
- Reusable React components

#### 3. **Portability**
- Relative paths in configuration
- Embedded SQLite database
- Cross-platform file path handling
- Single binary distribution goal

#### 4. **Type Safety**
- Strong typing in Go with interfaces
- Full TypeScript coverage in frontend
- Matching Go structs ↔ TypeScript interfaces

#### 5. **Real-Time Synchronization**
- WebSocket broadcasts for backend events (file changes, data updates)
- BroadcastChannel for frontend inter-window sync (DM → Player)
- File system watcher for automatic asset detection

#### 6. **Error Handling**
- Structured error types in backend
- Comprehensive logging with slog
- Recovery middleware catches panics
- User-friendly error messages in frontend