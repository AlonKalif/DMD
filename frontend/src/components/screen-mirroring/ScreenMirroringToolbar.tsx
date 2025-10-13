import { useEffect, useState } from 'react';
import clsx from 'clsx';

type PreviewStatus = 'empty' | 'staged' | 'live';

interface ScreenMirroringToolbarProps {
    previewStatus: PreviewStatus;
    onShowToPlayersClick: () => void;
    onHideFromPlayersClick: () => void;
    onPlayerWindowClose: () => void;
    // isPlayerFullScreen prop removed
}

export function ScreenMirroringToolbar({
                                           previewStatus,
                                           onShowToPlayersClick,
                                           onHideFromPlayersClick,
                                           onPlayerWindowClose,
                                           // isPlayerFullScreen removed
                                       }: ScreenMirroringToolbarProps) {
    const [playerWindow, setPlayerWindow] = useState<Window | null>(null);
    const isPlayerWindowOpen = playerWindow && !playerWindow.closed;

    // Window lifecycle effect (unchanged)
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

    // Opens the player window (unchanged)
    const openPlayerWindow = () => {
        if (!isPlayerWindowOpen) {
            const newWindow = window.open('/player', 'dmdPlayerWindow', 'popup,width=1280,height=720');
            setPlayerWindow(newWindow);
        }
    };

    // Closes the player window (unchanged)
    const closePlayerWindow = () => {
        if (isPlayerWindowOpen) {
            playerWindow?.close();
            setPlayerWindow(null);
        }
    };

    // Handler for Button 1 (Open/Close) (unchanged)
    const handleOpenCloseClick = () => {
        if (isPlayerWindowOpen) {
            closePlayerWindow();
        } else {
            openPlayerWindow();
        }
    };

    // Handler for Button 2 (Show/Hide) (unchanged)
    const handleShowHideClick = () => {
        if (previewStatus === 'live') {
            onHideFromPlayersClick();
        } else if (previewStatus === 'staged') {
            onShowToPlayersClick();
        }
    };

    // Handler for NEW Button 3 (Focus)
    const handleFocusClick = () => {
        if (isPlayerWindowOpen && playerWindow) {
            playerWindow.focus();
        }
    };

    // --- Button 1 (Open/Close) Logic ---
    const openCloseText = isPlayerWindowOpen ? 'Close Players Window' : 'Open Players Window';
    const openCloseColor = isPlayerWindowOpen ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700';

    // --- Button 2 (Show/Hide) Logic ---
    const showHideText = previewStatus === 'live' ? 'Hide From Players' : 'Show To Players';
    const isShowHideDisabled = !isPlayerWindowOpen || previewStatus === 'empty';
    const showHideColor = isShowHideDisabled
        ? 'bg-gray-500 cursor-not-allowed opacity-50'
        : previewStatus === 'live'
            ? 'bg-orange-600 hover:bg-orange-700'
            : 'bg-green-600 hover:bg-green-700';

    // --- Button 3 (Focus) Logic ---
    const focusText = 'Focus On Player Window';
    const isFocusDisabled = !isPlayerWindowOpen;
    const focusColor = isFocusDisabled
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

            {/* 3. Focus Button */}
            <button
                onClick={handleFocusClick}
                disabled={isFocusDisabled}
                className={clsx('rounded px-4 py-2 font-bold text-white', focusColor)}
            >
                {focusText}
            </button>

            <div className="ml-auto"></div>
        </div>
    );
}