## Troubleshooting

Common issues and solutions for DMD development.

---

## Quick Reference

### Backend Issues
- [Database locked error](./backend.md#database-locked-error)
- [Port already in use](./backend.md#port-already-in-use)
- [Missing Spotify credentials](./backend.md#missing-spotify-credentials)

### Frontend Issues
- [Port 3000 already in use](./frontend.md#port-3000-already-in-use)
- [npm install fails](./frontend.md#npm-install-fails)
- [Module not found errors](./frontend.md#module-not-found-errors)

### WSL2 Issues
- [Connection refused](./wsl2.md#connection-refused-wsl2)
- [Spotify OAuth: INVALID_CLIENT](./wsl2.md#spotify-oauth-invalid_client-insecure-redirect-uri)
- [Spotify OAuth: Invalid redirect URI](./wsl2.md#spotify-oauth-invalid-redirect-uri)

---

## Detailed Guides

- **[Backend Troubleshooting](./backend.md)** - Database, port, and configuration issues
- **[Frontend Troubleshooting](./frontend.md)** - Port conflicts, dependencies, and build errors
- **[WSL2 Troubleshooting](./wsl2.md)** - Connection and Spotify OAuth issues for WSL2 users
- **[Complete WSL2 Spotify OAuth Guide](../SPOTIFY_OAUTH_WSL2_TROUBLESHOOTING.md)** - Comprehensive troubleshooting (476 lines)

---

## General Tips

1. **Restart everything:**
   - Stop backend (`Ctrl+C`)
   - Stop frontend (`Ctrl+C`)
   - Start backend first, then frontend

2. **Check versions:**
   ```bash
   go version        # Should be 1.24.0+
   node --version    # Should be 18.x+
   ```

3. **Check backend health:**
   ```bash
   curl http://localhost:8080/health
   ```
