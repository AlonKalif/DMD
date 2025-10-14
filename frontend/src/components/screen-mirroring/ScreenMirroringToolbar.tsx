import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { LayoutStatus } from 'pages/ScreenMirroringPage';

interface ScreenMirroringToolbarProps {
    previewStatus: LayoutStatus;
    onShowToPlayersClick: () => void;
    onHideFromPlayersClick: () => void;
    onPlayerWindowClose: () => void;
    onSyncWithPlayerClick: () => void;
}

export function ScreenMirroringToolbar({
       previewStatus,
       onShowToPlayersClick,
       onHideFromPlayersClick,
       onPlayerWindowClose,
       onSyncWithPlayerClick,
    }: ScreenMirroringToolbarProps) {
    const [playerWindow, setPlayerWindow] = useState<Window | null>(null);
    const isPlayerWindowOpen = playerWindow && !playerWindow.closed;

    // This effect runs only once on mount to find an existing player window.
    useEffect(() => {
        // Use window.open with an empty URL and the known window name.
        // This will not open a new window but return a handle if one exists.
        const existingWindow = window.open('', 'dmdPlayerWindow');

        // If we get a handle and it has an "opener", it's our popup.
        if (existingWindow && existingWindow.opener) {
            // If it's somehow already closed, do nothing.
            if (existingWindow.closed) {
                return;
            }
            // Otherwise, set it in our state to "re-connect" to it.
            setPlayerWindow(existingWindow);
        } else if (existingWindow) {
            // If we got a handle but no opener, we likely created a blank window. Close it.
            existingWindow.close();
        }
    }, []); // The empty array ensures this runs only on component mount.

    // Window lifecycle effect
    useEffect(() => {
        if (!playerWindow) return;
        const intervalId = setInterval(() => {
            if (playerWindow.closed) {
                setPlayerWindow(null);
                onPlayerWindowClose();
                clearInterval(intervalId);
            }
        }, 1000);
        return () => clearInterval(intervalId);
    }, [playerWindow, onPlayerWindowClose]);

    const openPlayerWindow = () => {
        if (!isPlayerWindowOpen) {
            const newWindow = window.open('/player', 'dmdPlayerWindow', 'popup,width=1280,height=720');
            setPlayerWindow(newWindow);
        }
    };

    const closePlayerWindow = () => {
        if (isPlayerWindowOpen) {
            playerWindow?.close();
            setPlayerWindow(null);
            onPlayerWindowClose(); // Call this immediately for the button click
        }
    };

    const handleOpenCloseClick = () => {
        if (isPlayerWindowOpen) {
            closePlayerWindow();
        } else {
            openPlayerWindow();
        }
    };

    const handleShowHideClick = () => {
        if (previewStatus === 'live') {
            onHideFromPlayersClick();
        } else if (previewStatus === 'staged') {
            onShowToPlayersClick();
        }
    };

    const handleFocusClick = () => {
        if (isPlayerWindowOpen && playerWindow) {
            playerWindow.focus();
        }
    };

    // Open / Close Button
    const openCloseText = isPlayerWindowOpen ? 'Close Players Window' : 'Open Players Window';
    const openCloseColor = isPlayerWindowOpen ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700';

    // Show / Hide Button
    const showHideText = previewStatus === 'live' ? 'Hide From Players' : 'Show To Players';
    const isShowHideDisabled = !isPlayerWindowOpen || previewStatus === 'empty';
    const showHideColor = isShowHideDisabled
        ? 'bg-gray-500 cursor-not-allowed opacity-50'
        : previewStatus === 'live'
            ? 'bg-orange-600 hover:bg-orange-700'
            : 'bg-green-600 hover:bg-green-700';

    // Focus Button
    const focusText = 'Focus Player Window';
    const isFocusDisabled = !isPlayerWindowOpen;
    const focusColor = isFocusDisabled
        ? 'bg-gray-500 cursor-not-allowed opacity-50'
        : 'bg-purple-600 hover:bg-purple-700';

    // Sync Button
    const syncText = 'Get Player View';
    const isSyncDisabled = !isPlayerWindowOpen;
    const syncColor = isSyncDisabled
        ? 'bg-gray-500 cursor-not-allowed opacity-50'
        : 'bg-purple-600 hover:bg-purple-700';

    return (
        <div className="flex w-full items-center gap-4 border-b border-gray-700 bg-gray-800 p-2">

            {/* 1. Open/Close Button */}
            <button
                onClick={handleOpenCloseClick}
                className={clsx('rounded px-4 py-2 font-bold text-white', openCloseColor)}
            >
                {openCloseText}
            </button>

            {/* 2. Show/Hide Button */}
            <button
                onClick={handleShowHideClick}
                disabled={isShowHideDisabled}
                className={clsx('rounded px-4 py-2 font-bold text-white', showHideColor)}
            >
                {showHideText}
            </button>

            {/* 3. Sync Button (New) */}
            <button
                onClick={onSyncWithPlayerClick}
                disabled={isSyncDisabled}
                className={clsx('rounded px-4 py-2 font-bold text-white', syncColor)}
            >
                {syncText}
            </button>

            <div className="flex items-center gap-4">
                {/* 4. Focus Button */}
                <button
                    onClick={handleFocusClick}
                    disabled={isFocusDisabled}
                    className={clsx('rounded px-4 py-2 font-bold text-white', focusColor)}
                >
                    {focusText}
                </button>

                {/* Instructional Text */}
                <div className="flex flex-col text-sm text-gray-500">
                    <span>Press focus and then</span>
                    <span>F11 to go full screen</span>
                </div>

            </div>
            <div className="ml-auto"></div>
        </div>
    );
}