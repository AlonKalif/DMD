import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { checkAuthStatus, fetchUserProfile, logoutFromSpotify } from 'features/spotify/spotifySlice';
import { SpotifyLoginButton } from 'components/spotify/SpotifyLoginButton';
import { SpotifyPlayer } from 'components/spotify/SpotifyPlayer';
import { PlaylistPanel } from 'components/spotify/PlaylistPanel';

export default function AudioPlayerPage() {
    const dispatch = useAppDispatch();
    const { isLoggedIn, isCheckingStatus, displayName, accessToken, error } = useAppSelector((state) => state.spotify);

    useEffect(() => {
        dispatch(checkAuthStatus());
    }, [dispatch]);

    // Fetch user profile once we have a token
    useEffect(() => {
        if (isLoggedIn && accessToken && !displayName) {
            dispatch(fetchUserProfile());
        }
    }, [isLoggedIn, accessToken, displayName, dispatch]);

    const handleLogout = () => {
        dispatch(logoutFromSpotify());
    };

    if (isCheckingStatus) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-faded-ink">Checking Spotify connection...</div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="flex h-full flex-col items-center justify-center space-y-4 p-8">
                <h1 className="text-3xl font-bold font-blackletter gold-gradient-text">Spotify Music Player</h1>
                <p className="text-parchment/70 text-center max-w-md">
                    Connect your Spotify account to play music during your D&D sessions.
                </p>
                <SpotifyLoginButton />
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col space-y-6 overflow-y-auto p-8">
            <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold font-blackletter gold-gradient-text">Spotify Music Player</h1>
                {displayName && (
                    <span className="text-sm text-faded-ink">
                        Signed in as <span className="font-medium text-paladin-gold">{displayName}</span>
                    </span>
                )}
                <button
                    onClick={handleLogout}
                    className="rounded border border-paladin-gold/30 px-3 py-1.5 text-sm text-parchment/70 transition-colors hover:border-wax-red hover:text-wax-red"
                >
                    Logout
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 rounded-lg border border-paladin-gold/40 bg-paladin-gold/10 px-4 py-3 text-sm text-paladin-gold">
                    <span>{error}</span>
                    <button
                        onClick={handleLogout}
                        className="ml-auto whitespace-nowrap rounded bg-paladin-gold px-3 py-1 text-sm font-medium text-ink transition-colors hover:bg-paladin-gold/80"
                    >
                        Reconnect
                    </button>
                </div>
            )}

            <SpotifyPlayer />

            <PlaylistPanel />
        </div>
    );
}