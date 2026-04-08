import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from 'config';

export interface SpotifyPlaylistTrackItem {
    id: string;
    name: string;
    uri: string;
    duration_ms: number;
    artists: Array<{ name: string }>;
    album: {
        name: string;
        images: Array<{ url: string; height: number; width: number }>;
    };
}

interface SpotifyState {
    isLoggedIn: boolean;
    accessToken: string | null;
    tokenExpiry: string | null;
    isCheckingStatus: boolean;
    isFetchingToken: boolean;
    error: string | null;
    // User profile
    displayName: string | null;
    // Player state
    isPlayerReady: boolean;
    deviceId: string | null;
    currentTrack: SpotifyTrack | null;
    isPlaying: boolean;
    position: number;
    duration: number;
    volume: number;
    // Playlists
    playlists: SpotifyPlaylist[];
    isFetchingPlaylists: boolean;
    // Selected playlist tracks
    selectedPlaylist: SpotifyPlaylist | null;
    playlistTracks: SpotifyPlaylistTrackItem[];
    isFetchingTracks: boolean;
}

interface SpotifyPlaylist {
    id: string;
    name: string;
    description: string;
    images: Array<{ url: string; height: number; width: number }>;
    tracks: {
        total: number;
    };
    uri: string;
}

const initialState: SpotifyState = {
    isLoggedIn: false,
    accessToken: null,
    tokenExpiry: null,
    isCheckingStatus: false,
    isFetchingToken: false,
    error: null,
    // User profile
    displayName: null,
    // Player state
    isPlayerReady: false,
    deviceId: null,
    currentTrack: null,
    isPlaying: false,
    position: 0,
    duration: 0,
    volume: 0.5,
    // Playlists
    playlists: [],
    isFetchingPlaylists: false,
    // Selected playlist tracks
    selectedPlaylist: null,
    playlistTracks: [],
    isFetchingTracks: false,
};

// Check if user is authenticated
export const checkAuthStatus = createAsyncThunk(
    'spotify/checkStatus',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/v1/auth/spotify/status`);
            return response.data.authenticated;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to check auth status');
        }
    }
);

// Fetch access token (with auto-refresh)
export const fetchAccessToken = createAsyncThunk(
    'spotify/fetchToken',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/v1/auth/spotify/token`);
            return {
                accessToken: response.data.access_token,
                tokenExpiry: response.data.expiry,
            };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch token');
        }
    }
);

// Fetch user's playlists
export const fetchPlaylists = createAsyncThunk(
    'spotify/fetchPlaylists',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as { spotify: SpotifyState };
            const token = state.spotify.accessToken;
            
            const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data.items;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch playlists');
        }
    }
);

// Fetch tracks for a specific playlist
export const fetchPlaylistTracks = createAsyncThunk(
    'spotify/fetchPlaylistTracks',
    async (playlistId: string, { getState, rejectWithValue }) => {
        try {
            const state = getState() as { spotify: SpotifyState };
            const token = state.spotify.accessToken;

            const response = await axios.get(
                `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const tracks: SpotifyPlaylistTrackItem[] = response.data.items
                .filter((item: any) => item.track !== null)
                .map((item: any) => ({
                    id: item.track.id,
                    name: item.track.name,
                    uri: item.track.uri,
                    duration_ms: item.track.duration_ms,
                    artists: item.track.artists,
                    album: item.track.album,
                }));

            return tracks;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch playlist tracks');
        }
    }
);

// Fetch the current user's Spotify profile
export const fetchUserProfile = createAsyncThunk(
    'spotify/fetchUserProfile',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as { spotify: SpotifyState };
            const token = state.spotify.accessToken;

            const response = await axios.get('https://api.spotify.com/v1/me', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data.display_name as string;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch user profile');
        }
    }
);

// Logout from Spotify (delete token on backend)
export const logoutFromSpotify = createAsyncThunk(
    'spotify/logout',
    async (_, { rejectWithValue }) => {
        try {
            await axios.post(`${API_BASE_URL}/api/v1/auth/spotify/logout`);
            return;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to logout');
        }
    }
);

const spotifySlice = createSlice({
    name: 'spotify',
    initialState,
    reducers: {
        clearError(state) {
            state.error = null;
        },
        logout(state) {
            state.isLoggedIn = false;
            state.accessToken = null;
            state.tokenExpiry = null;
            state.displayName = null;
            state.isPlayerReady = false;
            state.deviceId = null;
            state.currentTrack = null;
            state.isPlaying = false;
            state.playlists = [];
        },
        setPlayerReady(state, action: PayloadAction<{ ready: boolean; deviceId: string | null }>) {
            state.isPlayerReady = action.payload.ready;
            state.deviceId = action.payload.deviceId;
        },
        setCurrentTrack(state, action: PayloadAction<SpotifyTrack | null>) {
            state.currentTrack = action.payload;
        },
        setPlaybackState(state, action: PayloadAction<{ isPlaying: boolean; position: number; duration: number }>) {
            state.isPlaying = action.payload.isPlaying;
            state.position = action.payload.position;
            state.duration = action.payload.duration;
        },
        setVolume(state, action: PayloadAction<number>) {
            state.volume = action.payload;
        },
        setAuthError(state, action: PayloadAction<string>) {
            state.error = action.payload;
        },
        selectPlaylist(state, action: PayloadAction<SpotifyPlaylist>) {
            state.selectedPlaylist = action.payload;
            state.playlistTracks = [];
        },
        clearSelectedPlaylist(state) {
            state.selectedPlaylist = null;
            state.playlistTracks = [];
        },
    },
    extraReducers: (builder) => {
        builder
            // Check Status
            .addCase(checkAuthStatus.pending, (state) => {
                state.isCheckingStatus = true;
                state.error = null;
            })
            .addCase(checkAuthStatus.fulfilled, (state, action: PayloadAction<boolean>) => {
                state.isCheckingStatus = false;
                state.isLoggedIn = action.payload;
                
                // If logged in, immediately fetch token
                if (action.payload && !state.accessToken) {
                    // Token fetch will be triggered by component
                }
            })
            .addCase(checkAuthStatus.rejected, (state, action) => {
                state.isCheckingStatus = false;
                state.error = action.payload as string;
            })
            // Fetch Token
            .addCase(fetchAccessToken.pending, (state) => {
                state.isFetchingToken = true;
                state.error = null;
            })
            .addCase(fetchAccessToken.fulfilled, (state, action) => {
                state.isFetchingToken = false;
                state.accessToken = action.payload.accessToken;
                state.tokenExpiry = action.payload.tokenExpiry;
                state.isLoggedIn = true;
            })
            .addCase(fetchAccessToken.rejected, (state, action) => {
                state.isFetchingToken = false;
                state.error = action.payload as string;
                state.isLoggedIn = false;
            })
            // Fetch Playlists
            .addCase(fetchPlaylists.pending, (state) => {
                state.isFetchingPlaylists = true;
                state.error = null;
            })
            .addCase(fetchPlaylists.fulfilled, (state, action) => {
                state.isFetchingPlaylists = false;
                state.playlists = action.payload;
            })
            .addCase(fetchPlaylists.rejected, (state, action) => {
                state.isFetchingPlaylists = false;
                state.error = action.payload as string;
            })
            // Fetch Playlist Tracks
            .addCase(fetchPlaylistTracks.pending, (state) => {
                state.isFetchingTracks = true;
                state.error = null;
            })
            .addCase(fetchPlaylistTracks.fulfilled, (state, action) => {
                state.isFetchingTracks = false;
                state.playlistTracks = action.payload;
            })
            .addCase(fetchPlaylistTracks.rejected, (state, action) => {
                state.isFetchingTracks = false;
                state.error = action.payload as string;
            })
            // Fetch User Profile
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.displayName = action.payload;
            })
            // Logout
            .addCase(logoutFromSpotify.fulfilled, (state) => {
                Object.assign(state, initialState);
            })
            .addCase(logoutFromSpotify.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    },
});

export const { clearError, logout, setPlayerReady, setCurrentTrack, setPlaybackState, setVolume, setAuthError, selectPlaylist, clearSelectedPlaylist } = spotifySlice.actions;
export default spotifySlice.reducer;

