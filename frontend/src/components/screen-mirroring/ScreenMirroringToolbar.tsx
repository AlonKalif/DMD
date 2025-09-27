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
    const isShowDisabled = previewStatus !== 'staged';
    const isHideDisabled = previewStatus !== 'live';
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
        if (isPlayerWindowOpen) {
            playerWindow?.focus();
            return;
        }
        const newWindow = window.open('/player', 'dmdPlayerWindow', 'popup,width=1280,height=720');
        setPlayerWindow(newWindow);
    };

    return (
        <div className="flex w-full items-center gap-4 border-b border-gray-700 bg-gray-800 p-2">
            {/* ==================================== Open player window button ===================================== */}
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

            <div className="ml-auto flex gap-4">
            {/* ========================================== Browse button =========================================== */}
                <button
                    onClick={onBrowseClick}
                    className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
                >
                    Browse...
                </button>

            {/* ====================================== Show to players button ====================================== */}
                <button
                    onClick={onShowToPlayersClick}
                    disabled={isShowDisabled}
                    className={clsx('rounded bg-green-600 px-4 py-2 font-bold text-white', isShowDisabled && 'cursor-not-allowed opacity-50')}
                >
                    Show to Players
                </button>

                {/* =================================== Hide from players button =================================== */}
                <button
                    onClick={onHideFromPlayersClick}
                    disabled={isHideDisabled}
                    className={clsx('rounded bg-red-600 px-4 py-2 font-bold text-white', isHideDisabled && 'cursor-not-allowed opacity-50')}
                >
                    Hide from Players
                </button>
            </div>
        </div>
    );
}