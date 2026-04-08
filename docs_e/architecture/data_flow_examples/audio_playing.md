#### Spotify Playback Flow
```
User clicks "Connect with Spotify"
  → Opens OAuth popup window
  → Backend redirects to Spotify authorization
  → User approves
  → Spotify redirects to callback
  → Backend exchanges code for tokens
  → Tokens stored in database (SpotifyToken, ID=1)
  → Frontend fetches playlists via backend proxy
  → Spotify Web Playback SDK controls playback
```