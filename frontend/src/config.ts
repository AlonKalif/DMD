// File: /src/config.ts
// Use environment variables for flexibility across dev/prod environments
// Fallback to localhost for environments without .env files
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
export const SPOTIFY_AUTH_URL = process.env.REACT_APP_SPOTIFY_AUTH_URL || 'http://127.0.0.1:8080';

// export const DEFAULT_PLAYER_WINDOW_IMG = '/Red_Dragon_5eR.webp'
// export const DEFAULT_PLAYER_WINDOW_IMG = 'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bjczZjJsbjY2ZnpxNTRmcTAzOG9iNnM3M216aXpyNWszaTR5eWFoMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/iBlgTxSS20NLdCxvDW/giphy.gif'
export const DEFAULT_PLAYER_WINDOW_IMG = '/dmd_logo_ember_full_screen.png'