## Prerequisites

### Required Software

| Software | Minimum Version | Recommended | Purpose |
|----------|----------------|-------------|---------|
| **Go** | 1.24.0 | Latest 1.24.x | Backend development |
| **Node.js** | 18.x | 18.x or 20.x | Frontend development |
| **npm** | 8.x | Latest | Package management |
| **Chrome** | Latest | Latest stable | Target browser |

### System Requirements

- **OS**: Linux, Windows, macOS
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 2GB for dependencies and build artifacts

### Optional Tools

- **Air**: Go hot reload for backend development
  ```bash
  go install github.com/cosmtrek/air@latest
  ```

- **WSLg** (Windows 11+ only): Run GUI apps from WSL2
  - Automatically included in Windows 11
  - Allows running Chrome inside WSL2

### Notes

- **Chrome/Chromium only**: This application is optimized for Chrome/Chromium browsers
- **WSL2 Users**: See [WSL2 Setup Guide](./wsl2_setup.md) for additional configuration
- **Development Environment**: Designed for local development; production deployment not yet implemented
