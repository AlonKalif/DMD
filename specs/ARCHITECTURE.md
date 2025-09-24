# Technical Architecture

## 1. Application Stack

### Frontend
- Platform: Google Chrome (optimized for Chrome browser)
- Framework: React with TypeScript
- State Management: Redux + Redux Toolkit
- Styling: Tailwind CSS
- Progressive Web App (PWA) capabilities

### Backend
- Language: Go (Golang)
- Database: SQLite (for portability)
- File Storage: Local file system with relative paths
- RESTful API + WebSocket for real-time communications
- Gorilla Mux for routing
- GORM for database operations (with SQLite driver)

## 2. Core Systems

### Window Management
- Browser tab management system
- Chrome tab synchronization API
- Screen detection through Web Screen API
- Cross-tab communication via BroadcastChannel API

### Data Management
- Local SQLite database operations
- Local file system for assets (images, audio)
- Simple database migrations
- Local backup system with export/import functionality
- Relative path management for portability

### Audio System
- Web Audio API for local audio
- YouTube API integration
- Spotify Web Playback SDK integration
- Audio mixing and effects

### Real-time Updates
- WebSocket for DM/Player window sync
- State synchronization system
- Optimistic updates

## 3. Performance Considerations

### Image Handling
- Lazy loading
- Image optimization
- Caching system
- Memory management

### Audio Processing
- Stream management
- Buffer handling
- Memory cleanup

### State Management
- Efficient updates
- Minimal re-renders
- Memoization

## 4. Portability

### Data Portability
- Single-file SQLite database
- Relative path resolution for assets
- Export/Import functionality for entire app state
- Automatic path adjustment on move/copy

### External Services
- Optional YouTube API integration
- Optional Spotify API integration
- Fallback to local-only operation

## 5. Error Handling

### Recovery System
- Auto-save
- State recovery
- Error boundaries
- Logging system

## 6. Development Workflow

### Build System
- Webpack configuration
- Development environment
- Production optimization

### Testing
- Unit tests (Jest)
- Integration tests
- E2E tests (Playwright)

### Deployment
- Auto-updates
- Version management
- Release pipeline

## 7. Integration Points

### External APIs
- YouTube Data API
- Spotify Web API
- D&D 5e API (if available)

### File Systems
- Asset management
- Import/Export system
- Backup system

## 8. File Management
- Directory structure management
- Asset organization
- Automatic file cleanup
- Backup creation and restoration

## 9. Portability Features
- Single executable distribution
- Self-contained database
- Portable settings storage
- Relative path handling for all resources
