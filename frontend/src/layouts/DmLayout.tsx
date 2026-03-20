import { BottomNavBar } from 'components/layout/BottomNavBar';
import { Outlet } from 'react-router-dom';
import { useWebSocket } from 'hooks/useWebSocket';
import { useSpotifyPlayer } from 'hooks/useSpotifyPlayer';
import { useAppDispatch } from 'app/hooks';
import { fetchImages } from 'features/images/imageSlice';
import { checkAuthStatus, fetchAccessToken } from 'features/spotify/spotifySlice';
import { useEffect, useCallback } from 'react';
import {API_BASE_URL} from "config";

export default function DmLayout() {
    const dispatch = useAppDispatch();

    // Fetch images on initial load
    useEffect(() => {
        dispatch(fetchImages());
        
        // Check Spotify auth status and pre-warm token
        dispatch(checkAuthStatus()).then((result) => {
            if (result.payload === true) {
                // If logged in, fetch token immediately
                dispatch(fetchAccessToken());
            }
        });
    }, [dispatch]);

    // Handle incoming WebSocket messages
    // Memoize this function with useCallback
    const handleWebSocketMessage = useCallback((message: any) => {
        if (message.type === 'images_updated') {
            console.log('Image library updated via WebSocket, re-fetching...');
            dispatch(fetchImages());
        }
    }, [dispatch]); // Add dispatch as a dependency

    // Now, the onMessage function is stable between re-renders
    useWebSocket(`${API_BASE_URL}/ws`, handleWebSocketMessage);

    // Keep the Spotify player alive across page navigations
    useSpotifyPlayer();

    return (
        <div className="relative min-h-screen bg-obsidian">
            <div className="d20-background" aria-hidden="true">
                {"pentagon ".repeat(200)}
            </div>
            <div className="relative z-10 flex flex-col min-h-screen pb-16">
                <header className="flex items-center gap-3 px-4 py-2 border-b border-paladin-gold/15">
                    <img src="/dmd_logo.png" alt="DMD" className="logo-gold h-12 w-12" />
                    <h1 className="text-xl font-blackletter gold-gradient-text tracking-wide">DM Dashboard</h1>
                </header>
                <div className="flex-1">
                    <Outlet />
                </div>
                <BottomNavBar />
            </div>
        </div>
    );
}