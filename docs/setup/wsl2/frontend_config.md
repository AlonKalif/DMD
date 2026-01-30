## Frontend Configuration for WSL2

### Environment Variables

The frontend uses environment variables to configure API endpoints:

| File | Purpose | Committed |
|------|---------|-----------|
| `.env` | Default development config | Yes |
| `.env.local` | Local overrides (WSL2) | No |
| `.env.production` | Production build config | Yes |

### For Port Forwarding Setup

If using Windows port forwarding, create `.env.local`:

```bash
cd frontend
cat > .env.local << 'EOF'
REACT_APP_API_BASE_URL=http://127.0.0.1:8080
REACT_APP_SPOTIFY_AUTH_URL=http://127.0.0.1:8080
EOF
```

**Why `127.0.0.1` instead of `localhost`?**
- More explicit for Spotify OAuth redirect URIs
- Avoids IPv6 vs IPv4 ambiguity
- Matches backend configuration

### For Chrome in WSL2

If running Chrome inside WSL2, the default `.env` works:

```bash
# No changes needed - default .env uses localhost
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_SPOTIFY_AUTH_URL=http://127.0.0.1:8080
```

### Environment Variable Priority

`.env.local` > `.env` > `.env.production`

- `.env.local` is gitignored (never committed)
- Use it for local machine-specific overrides
- Changes require frontend restart (`Ctrl+C` and `npm start`)

### Verifying Configuration

Check in browser console:

```javascript
console.log(process.env.REACT_APP_API_BASE_URL)
```

Should output your configured API URL.
