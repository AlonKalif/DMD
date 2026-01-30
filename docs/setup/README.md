## Setup & Development Guide

Complete guide to setting up and running DMD for local development.

---

## Quick Start

For experienced developers who want to get started quickly:

```bash
# 1. Configure backend
cd backend/internal/server
cp server_config.example.json server_config.json
# Edit server_config.json with your Spotify credentials

# 2. Start backend
cd ../..
go run cmd/main.go

# 3. Start frontend (new terminal)
cd frontend
npm install
npm start

# 4. Open browser
# DM Window: http://localhost:3000
# Player Window: http://localhost:3000/player
```

---

## Detailed Setup Guides

### 1. [Prerequisites](./prerequisites.md)
System requirements and required software versions.

### 2. [Configuration](./configuration.md)
First-time setup: Spotify API credentials and environment variables.

### 3. [Backend Setup](./backend_setup.md)
Installing dependencies and running the Go backend server.

### 4. [Frontend Setup](./frontend_setup.md)
Installing dependencies and running the React development server.

### 5. [Running the Application](./running_application.md)
How to run both servers simultaneously and open the dual-window interface.

### 6. WSL2 Users
If developing in WSL2 with Chrome on Windows, follow these guides:

- [WSL2 Overview](./wsl2/overview.md) - Why WSL2 needs special setup
- [Port Forwarding](./wsl2/port_forwarding.md) - Recommended approach
- [Chrome in WSL2](./wsl2/chrome_in_wsl2.md) - Alternative approach
- [Frontend Config](./wsl2/frontend_config.md) - Environment variables

---

## Troubleshooting

Having issues? See the [Troubleshooting Guide](../troubleshooting/README.md):
- [Backend Issues](../troubleshooting/backend.md) - Database, port, configuration
- [Frontend Issues](../troubleshooting/frontend.md) - Port conflicts, dependencies, build errors
- [WSL2 Issues](../troubleshooting/wsl2.md) - Connection and Spotify OAuth for WSL2 users

---

## Next Steps

After setup is complete:
- See [Features Documentation](../features.md) for what you can do
- See [Architecture Documentation](../architecture/) to understand the system
- See [Folder Structure](../folder_structure/) to navigate the codebase
