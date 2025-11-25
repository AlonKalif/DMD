import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { setPlayerReady, setCurrentTrack, setPlaybackState } from 'features/spotify/spotifySlice';

// Initialize SDK ready callback globally before SDK loads
if (!window.onSpotifyWebPlaybackSDKReady) {
    window.onSpotifyWebPlaybackSDKReady = () => {
        window.dispatchEvent(new Event('spotify-sdk-ready'));
    };
}

export function useSpotifyPlayer() {
    const dispatch = useAppDispatch();
    const { accessToken, isLoggedIn } = useAppSelector((state) => state.spotify);
    const playerRef = useRef<SpotifyPlayer | null>(null);
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

        const player = new window.Spotify.Player({
            name: 'DMD Spotify Player',
            getOAuthToken: (cb) => {
                cb(accessToken);
            },
            volume: 0.5,
        });

        // Ready
        player.addListener('ready', ({ device_id }) => {
            console.log('Player ready with Device ID:', device_id);
            dispatch(setPlayerReady({ ready: true, deviceId: device_id }));
        });

        // Not Ready
        player.addListener('not_ready', ({ device_id }) => {
            console.log('Device has gone offline:', device_id);
            dispatch(setPlayerReady({ ready: false, deviceId: null }));
        });

        // Player State Changed
        player.addListener('player_state_changed', (state) => {
            if (!state) return;

            dispatch(setCurrentTrack(state.track_window.current_track));
            dispatch(setPlaybackState({
                isPlaying: !state.paused,
                position: state.position,
                duration: state.duration,
            }));
        });

        // Errors
        player.addListener('initialization_error', ({ message }) => {
            console.error('Initialization Error:', message);
        });

        player.addListener('authentication_error', ({ message }) => {
            console.error('Authentication Error:', message);
        });

        player.addListener('account_error', ({ message }) => {
            console.error('Account Error:', message);
        });

        // Connect to player
        player.connect();
        playerRef.current = player;

        // Cleanup
        return () => {
            player.disconnect();
            playerRef.current = null;
        };
    }, [isSDKReady, accessToken, isLoggedIn, dispatch]);

    return playerRef.current;
}

