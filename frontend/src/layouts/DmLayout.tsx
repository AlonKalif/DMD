import { BottomNavBar } from 'components/layout/BottomNavBar';
import { Outlet } from 'react-router-dom';
import { useWebSocket } from 'hooks/useWebSocket';
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

    return (
        <div className="pb-16">
            <Outlet />
            <BottomNavBar />
        </div>
    );
}