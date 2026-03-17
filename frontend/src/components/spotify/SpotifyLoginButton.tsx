import { useState, useRef, useEffect } from 'react';
import { useAppDispatch } from 'app/hooks';
import { checkAuthStatus, fetchAccessToken } from 'features/spotify/spotifySlice';
import { SPOTIFY_AUTH_URL } from 'config';

export function SpotifyLoginButton() {
    const dispatch = useAppDispatch();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const popupRef = useRef<Window | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
            if (popupRef.current && !popupRef.current.closed) {
                popupRef.current.close();
            }
        };
    }, []);

    const handleLogin = () => {
        setIsAuthenticating(true);

        // Open login URL in popup window
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        popupRef.current = window.open(
            `${SPOTIFY_AUTH_URL}/api/v1/auth/spotify/login`,
            'spotify-login',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        // Poll to detect when popup closes
        pollIntervalRef.current = setInterval(() => {
            if (popupRef.current?.closed) {
                clearInterval(pollIntervalRef.current!);
                pollIntervalRef.current = null;
                popupRef.current = null;

                // Check auth status after popup closes
                dispatch(checkAuthStatus()).then((result) => {
                    if (result.payload === true) {
                        // If authenticated, fetch token immediately
                        dispatch(fetchAccessToken());
                    }
                    setIsAuthenticating(false);
                });
            }
        }, 500);
    };

    return (
        <button
            onClick={handleLogin}
            disabled={isAuthenticating}
            className="flex items-center justify-center space-x-2 rounded-lg bg-paladin-gold px-6 py-3 text-ink font-semibold font-blackletter transition-colors hover:bg-paladin-gold/80 disabled:bg-faded-ink disabled:cursor-not-allowed arcane-glow-hover border border-transparent"
        >
            {isAuthenticating ? (
                <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Connecting to Spotify...</span>
                </>
            ) : (
                <>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    <span>Connect with Spotify</span>
                </>
            )}
        </button>
    );
}

