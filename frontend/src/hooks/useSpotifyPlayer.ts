import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { setPlayerReady, setCurrentTrack, setPlaybackState, setAuthError } from 'features/spotify/spotifySlice';

// Initialize SDK ready callback globally before SDK loads
if (!window.onSpotifyWebPlaybackSDKReady) {
    window.onSpotifyWebPlaybackSDKReady = () => {
        window.dispatchEvent(new Event('spotify-sdk-ready'));
    };
}

// Module-level singleton — survives component mount/unmount cycles
let playerInstance: SpotifyPlayer | null = null;

export function useSpotifyPlayer() {
    const dispatch = useAppDispatch();
    const { accessToken, isLoggedIn } = useAppSelector((state) => state.spotify);
    const [isSDKReady, setIsSDKReady] = useState(false);

    // Wait for SDK to load
    useEffect(() => {
        if (window.Spotify) {
            setIsSDKReady(true);
            return;
        }
        
        const handleSDKReady = () => setIsSDKReady(true);
        window.addEventListener('spotify-sdk-ready', handleSDKReady);
        return () => window.removeEventListener('spotify-sdk-ready', handleSDKReady);
    }, []);

    // Initialize player when SDK and token are ready
    useEffect(() => {
        if (!isSDKReady || !accessToken || !isLoggedIn) return;
        if (playerInstance) return;

        const player = new window.Spotify.Player({
            name: 'DMD Spotify Player',
            getOAuthToken: (cb) => {
                cb(accessToken);
            },
            volume: 0.5,
        });

        player.addListener('ready', ({ device_id }) => {
            dispatch(setPlayerReady({ ready: true, deviceId: device_id }));
        });

        player.addListener('not_ready', () => {
            dispatch(setPlayerReady({ ready: false, deviceId: null }));
        });

        player.addListener('player_state_changed', (state) => {
            if (!state) return;
            dispatch(setCurrentTrack(state.track_window.current_track));
            dispatch(setPlaybackState({
                isPlaying: !state.paused,
                position: state.position,
                duration: state.duration,
            }));
        });

        player.addListener('initialization_error', ({ message }) => {
            console.error('Initialization Error:', message);
        });

        player.addListener('authentication_error', ({ message }) => {
            console.error('Authentication Error:', message);
            dispatch(setAuthError('Spotify session has expired or is missing permissions. Please logout and reconnect.'));
        });

        player.addListener('account_error', ({ message }) => {
            console.error('Account Error:', message);
        });

        player.connect();
        playerInstance = player;
    }, [isSDKReady, accessToken, isLoggedIn, dispatch]);

    // Disconnect only on logout
    useEffect(() => {
        if (!isLoggedIn && playerInstance) {
            playerInstance.disconnect();
            playerInstance = null;
        }
    }, [isLoggedIn]);

    return playerInstance;
}
