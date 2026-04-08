## WSL2 Setup Overview

### Why WSL2 Needs Special Setup

When developing in WSL2 with Chrome on Windows:
- Backend runs **inside WSL2** Linux environment
- Chrome browser runs on **Windows host** OS
- They have **separate network stacks**
- `localhost` in WSL2 ≠ `localhost` in Windows
- Spotify OAuth requires `localhost`/`127.0.0.1` for HTTP (security policy)

### The Problem

```
┌─────────────────────────────────────┐
│         Windows (Host)              │
│                                     │
│  Chrome → http://localhost:8080    │  ❌ Can't reach backend
│                                     │
└─────────────────────────────────────┘
            Network Isolation
┌─────────────────────────────────────┐
│         WSL2 (Guest)                │
│                                     │
│  Backend Server → :8080            │
│                                     │
└─────────────────────────────────────┘
```

### Solutions

Choose one approach:

1. **[Port Forwarding](./port_forwarding.md)** (Recommended)
   - Forward Windows `127.0.0.1:8080` → WSL2 backend
   - Works with native Windows Chrome
   - Requires setup after WSL2 IP changes

2. **[Chrome in WSL2](./chrome_in_wsl2.md)** (Alternative)
   - Run Chrome inside WSL2 using WSLg
   - Requires Windows 11+
   - No port forwarding needed
   - Chrome uses WSL2 profile

### Frontend Configuration

See [Frontend Configuration](./frontend_config.md) for environment variable setup.

### Troubleshooting

For detailed troubleshooting, see the [WSL2 Troubleshooting Guide](../../SPOTIFY_OAUTH_WSL2_TROUBLESHOOTING.md).
