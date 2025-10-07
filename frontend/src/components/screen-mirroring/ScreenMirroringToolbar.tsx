import {useEffect, useState} from 'react';
import clsx from 'clsx';

type PreviewStatus = 'empty' | 'staged' | 'live';

interface ScreenMirroringToolbarProps {
    previewStatus: PreviewStatus;
    onBrowseClick: () => void;
    onShowToPlayersClick: () => void;
    onHideFromPlayersClick: () => void;
}

export function ScreenMirroringToolbar({
                                           previewStatus,
                                           onBrowseClick,
                                           onShowToPlayersClick,
                                           onHideFromPlayersClick,
                                       }: ScreenMirroringToolbarProps) {
    const [playerWindow, setPlayerWindow] = useState<Window | null>(null);
    const isPlayerWindowOpen = playerWindow && !playerWindow.closed;

    // This effect hook for lifecycle remains the same.
    useEffect(() => {
        if (!playerWindow) return;
        const intervalId = setInterval(() => {
            if (playerWindow.closed) {
                setPlayerWindow(null);
                clearInterval(intervalId);
            }
        }, 1000);
        return () => clearInterval(intervalId);
    }, [playerWindow]);

    const openOrFocusPlayerWindow = () => {
        if (isPlayerWindowOpen) {
            playerWindow?.focus();
            return; // Window was already open
        }
        const newWindow = window.open('/player', 'dmdPlayerWindow', 'popup,width=1280,height=720');
        setPlayerWindow(newWindow);
    };

    // New handler for the "Show to Players" button.
    const handleShowClick = () => {
        const wasOpen = isPlayerWindowOpen;

        // Step 1: Ensure the window is open or focused.
        openOrFocusPlayerWindow();

        // Step 2: Call the passed-in function to send the content.
        if (wasOpen) {
            // If window was already open, send immediately.
            onShowToPlayersClick();
        } else {
            // If we just opened it, wait a moment for it to initialize.
            setTimeout(onShowToPlayersClick, 200);
        }
    };

    const isShowDisabled = previewStatus !== 'staged';
    const isHideDisabled = previewStatus !== 'live';
// handle case: player window open, image shown, player window closes, Hide from player is clicked.
    return (
        <div className="flex w-full items-center gap-4 border-b border-gray-700 bg-gray-800 p-2">
            <button
                onClick={openOrFocusPlayerWindow}
                className={clsx(
                    'rounded px-4 py-2 font-bold text-white',
                    isPlayerWindowOpen
                        ? 'bg-gray-500 hover:bg-gray-600' // Style for "Focus"
                        : 'bg-blue-600 hover:bg-blue-700'   // Style for "Open"
                )}
            >
                {isPlayerWindowOpen ? 'Focus Player Window' : 'Open Player Window'}
            </button>

            <div className="ml-auto flex gap-4">
                <button
                    onClick={onBrowseClick}
                    className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
                >
                    Browse...
                </button>

                {previewStatus !== 'live' ? (
                    <button
                        onClick={handleShowClick} // <-- Use the new handler here
                        disabled={isShowDisabled}
                        className={clsx('rounded bg-green-600 px-4 py-2 font-bold text-white', isShowDisabled && 'cursor-not-allowed opacity-50')}
                    >
                        Show to Players
                    </button>
                ) : (
                    <button
                        onClick={onHideFromPlayersClick}
                        disabled={isHideDisabled}
                        className={clsx('rounded bg-red-600 px-4 py-2 font-bold text-white', isHideDisabled && 'cursor-not-allowed opacity-50')}
                    >
                        Hide from Players
                    </button>
                )}
            </div>
        </div>
    );
}