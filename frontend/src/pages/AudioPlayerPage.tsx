import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { checkAuthStatus } from 'features/spotify/spotifySlice';
import { SpotifyLoginButton } from 'components/spotify/SpotifyLoginButton';
import { SpotifyPlayer } from 'components/spotify/SpotifyPlayer';
import { PlaylistPanel } from 'components/spotify/PlaylistPanel';

export default function AudioPlayerPage() {
    const dispatch = useAppDispatch();
    const { isLoggedIn, isCheckingStatus } = useAppSelector((state) => state.spotify);

    // Check authentication status on mount
    useEffect(() => {
        dispatch(checkAuthStatus());
    }, [dispatch]);

    if (isCheckingStatus) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-gray-400">Checking Spotify connection...</div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="flex h-full flex-col items-center justify-center space-y-4 p-8">
                <h1 className="text-3xl font-bold text-white">Spotify Music Player</h1>
                <p className="text-gray-400 text-center max-w-md">
                    Connect your Spotify account to play music during your D&D sessions.
                </p>
                <SpotifyLoginButton />
            </div>
        );
    }

    // Logged in state - show player and playlists
    return (
        <div className="flex h-full flex-col space-y-6 overflow-y-auto p-8">
            <h1 className="text-3xl font-bold text-white">Spotify Music Player</h1>
            
            {/* Player Controls */}
            <SpotifyPlayer />
            
            {/* Playlists */}
            <PlaylistPanel />
        </div>
    );
}