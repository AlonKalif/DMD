// File: /src/components/dm/DmToolbar.tsx
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useBroadcastChannel } from '../../hooks/useBroadcastChannel';

export function DmToolbar() {
    const [playerWindow, setPlayerWindow] = useState<Window | null>(null);
    // A simple boolean to track the window state for our UI
    const isPlayerWindowOpen = playerWindow && !playerWindow.closed;
    // We don't need to handle incoming messages here, so the callback is empty.
    const channel = useBroadcastChannel('dmd-channel', () => {});
    // This effect hook handles the lifecycle of the player window
    useEffect(() => {
        // If there's no window, there's nothing to check.
        if (!playerWindow) return;

        // Set up an interval to check if the window has been closed.
        const intervalId = setInterval(() => {
            if (playerWindow.closed) {
                setPlayerWindow(null); // Clear the window reference
                clearInterval(intervalId); // Stop checking
            }
        }, 1000); // Check every second

        // Cleanup function to clear the interval when the component unmounts.
        return () => {
            clearInterval(intervalId);
        };
    }, [playerWindow]);

    const handleOpenPlayerWindow = () => {
        // Check if the window is already open and hasn't been closed by the user.
        if (playerWindow && !playerWindow.closed) {
            playerWindow.focus(); // If it's open, just focus it.
            return;
        }

        // Define the features for the new window.
        const windowFeatures = 'popup,width=1280,height=720';

        // Open the new window and store a reference to it.
        const newWindow = window.open('/player', 'dmdPlayerWindow', windowFeatures);
        setPlayerWindow(newWindow);
    };

    const handleSendMessage = () => {
        const message = {
            type: 'show_image',
            payload: {
                url: '/images/goblin.png',
                caption: 'A goblin appears!',
            },
        };
        channel.postMessage(message);
    };

    return (
        <div className="flex gap-2 bg-gray-800 p-2">
            <button
                onClick={handleOpenPlayerWindow}
                className={clsx(
                    'rounded px-4 py-2 font-bold text-white',
                    isPlayerWindowOpen
                        ? 'bg-gray-500 hover:bg-gray-600' // Style for "Focus"
                        : 'bg-blue-600 hover:bg-blue-700'   // Style for "Open"
                )}
            >
                {isPlayerWindowOpen ? 'Focus Player Window' : 'Open Player Window'}
            </button>
            <button
                onClick={handleSendMessage}
                className="rounded bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700"
            >
                Send Test Image
            </button>
        </div>
    );
}