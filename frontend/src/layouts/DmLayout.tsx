import { BottomNavBar } from 'components/layout/BottomNavBar';
import { Outlet } from 'react-router-dom';
import { useWebSocket } from 'hooks/useWebSocket';
import { useAppDispatch } from 'app/hooks';
import { fetchImages } from 'features/images/imageSlice';
import { useEffect } from 'react';

export default function DmLayout() {
    const dispatch = useAppDispatch();

    // Fetch images on initial load
    useEffect(() => {
        dispatch(fetchImages());
    }, [dispatch]);

    // Handle incoming WebSocket messages
    const handleWebSocketMessage = (message: any) => {
        if (message.type === 'images_updated') {
            console.log('Image library updated via WebSocket, re-fetching...');
            dispatch(fetchImages());
        }
    };

    useWebSocket('ws://localhost:8080/ws', handleWebSocketMessage);

    return (
        <div className="pb-16">
            <Outlet />
            <BottomNavBar />
        </div>
    );
}