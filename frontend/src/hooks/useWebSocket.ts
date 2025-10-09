// File: /src/hooks/useWebSocket.ts
import { useEffect } from 'react';

export function useWebSocket(url: string, onMessage: (message: any) => void) {
    useEffect(() => {
        const ws = new WebSocket(url);

        ws.onopen = () => console.log('WebSocket connected');
        ws.onclose = () => console.log('WebSocket disconnected');
        ws.onerror = (error) => console.error('WebSocket error:', error);

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                onMessage(message);
            } catch (e) {
                console.error('Failed to parse WebSocket message:', e);
            }
        };

        // Cleanup function to close the connection when the component unmounts.
        return () => {
            ws.close();
        };
    }, [url, onMessage]);
}