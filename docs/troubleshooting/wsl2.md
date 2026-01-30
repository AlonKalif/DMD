## WSL2 Troubleshooting

### Connection Refused (WSL2)

**Symptom:**
- Chrome shows: "This site can't be reached, 127.0.0.1 refused to connect"
- Backend runs fine in WSL2 terminal

**Cause:** Chrome on Windows can't reach the WSL2 backend.

**Solution:**

1. Verify port forwarding is set up - see [WSL2 Port Forwarding Guide](../setup/wsl2/port_forwarding.md)
2. Check WSL2 IP hasn't changed:
   ```powershell
   wsl hostname -I
   ```
3. If IP changed, update port forwarding in PowerShell
4. Restart backend server

---

### Spotify OAuth: INVALID_CLIENT (Insecure Redirect URI)

**Symptom:**
```
INVALID_CLIENT: Invalid redirect URI
```

**Cause:** Spotify rejects redirect URIs that aren't `localhost` or `127.0.0.1` when using HTTP.

**Solution:**

You MUST use `127.0.0.1` and set up Windows port forwarding to WSL2. Spotify's security policy only allows HTTP with localhost IPs.

See [WSL2 Port Forwarding Guide](../setup/wsl2/port_forwarding.md).

---

### Spotify OAuth: Invalid Redirect URI

**Symptom:**
```
Invalid redirect URI
```

**Cause:** The redirect URI in Spotify Dashboard doesn't match the backend config.

**Solution:**

Ensure the `spotify_redirect_uri` in `server_config.json` exactly matches one of the URIs registered in your Spotify Dashboard:

```
http://127.0.0.1:8080/api/v1/auth/spotify/callback
```

---

For comprehensive WSL2 + Spotify troubleshooting, see:
- [Complete WSL2 Spotify OAuth Guide](../SPOTIFY_OAUTH_WSL2_TROUBLESHOOTING.md)
