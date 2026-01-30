## Backend Troubleshooting

### Database Locked Error

**Symptom:**
```
Error: database is locked
```

**Solution:**
- Close any other instances of the server
- Delete `dmd.db` and restart (WARNING: loses all data)

---

### Port Already in Use

**Symptom:**
```
Error: listen tcp :8080: bind: address already in use
```

**Solution:**

Find and stop the process using port 8080:

**Linux/macOS:**
```bash
lsof -i :8080
kill -9 <PID>
```

**Windows:**
```powershell
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

---

### Missing Spotify Credentials

**Symptom:**
```
Error: spotify_client_id not configured
```

**Solution:**

See [Configuration Guide](../setup/configuration.md) for detailed setup instructions.
