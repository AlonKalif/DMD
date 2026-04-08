## Tech Stack

### Target Platform
- **Browser**: Google Chrome / Chromium-based browsers
- **Desktop**: Cross-platform (Linux, Windows, macOS)
- **Architecture**: REST API + WebSocket for real-time sync
- **Deployment**: Desktop application with embedded database

---

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Go** | 1.24.0 | Backend language |
| **Gorilla Mux** | 1.8.1 | HTTP routing |
| **Gorilla WebSocket** | 1.5.3 | Real-time communication |
| **Gorilla Handlers** | 1.5.2 | CORS and HTTP middleware |
| **GORM** | 1.31.0 | ORM (Object-Relational Mapping) |
| **GORM Datatypes** | 1.2.7 | Extended GORM data types |
| **SQLite Driver** | 1.6.0 | SQLite database driver |
| **SQLite** | 3 | Embedded database |
| **fsnotify** | 1.9.0 | File system watcher |
| **slog** | stdlib | Structured logging |
| **Tint** | 1.1.2 | Colored console logging |
| **Spotify SDK** | 2.4.3 | Spotify Web API client |
| **OAuth2** | 0.33.0 | OAuth2 authentication flow |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **TypeScript** | 5.5.4 | Type-safe JavaScript |
| **React** | 18.3.1 | UI framework |
| **React DOM** | 18.3.1 | React rendering for web |
| **Redux Toolkit** | 2.2.6 | State management |
| **React Redux** | 9.1.2 | React bindings for Redux |
| **React Router** | 6.25.1 | Client-side routing |
| **Axios** | 1.7.2 | HTTP client |
| **React DnD** | 16.0.1 | Drag & drop framework |
| **React DnD HTML5 Backend** | 16.0.1 | HTML5 drag & drop backend |
| **Tailwind CSS** | 3.4.6 | Utility-first CSS framework |
| **Tailwind Merge** | 2.4.0 | Tailwind class merging utility |
| **Tailwind Scrollbar Hide** | 4.0.0 | Scrollbar hiding utilities |
| **clsx** | 2.1.1 | Conditional CSS class names |
| **Lucide React** | 0.412.0 | Icon library |
| **React Scripts** | 5.0.1 | Create React App build tooling |

### Development Tools
| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | latest | JavaScript/TypeScript linting |
| **Prettier** | 3.3.3 | Code formatting |
| **Prettier Tailwind Plugin** | 0.6.5 | Tailwind class sorting |
| **PostCSS** | 8.4.39 | CSS transformation tool |
| **Autoprefixer** | 10.4.19 | CSS vendor prefix automation |
| **Tailwind Scrollbar** | 3.1.0 | Custom scrollbar styling |
| **TypeScript ESLint** | 8.4.0 | TypeScript-specific linting rules |
| **Air** (optional) | latest | Go hot reload for development |
