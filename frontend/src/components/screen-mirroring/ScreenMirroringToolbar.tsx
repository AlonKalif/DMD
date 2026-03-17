import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { LayoutStatus } from 'pages/ScreenMirroringPage';

// Persists the player window reference across component mount/unmount cycles
// (React Router navigation doesn't reload the page, so module scope survives)
let playerWindowRef: Window | null = null;

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
    const [playerWindow, setPlayerWindow] = useState<Window | null>(() => {
        if (playerWindowRef && !playerWindowRef.closed) {
            return playerWindowRef;
        }
        playerWindowRef = null;
        return null;
    });
    const isPlayerWindowOpen = playerWindow && !playerWindow.closed;

    // Window lifecycle effect
    useEffect(() => {
        if (!playerWindow) return;
        const intervalId = setInterval(() => {
            if (playerWindow.closed) {
                playerWindowRef = null;
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
            playerWindowRef = newWindow;
            setPlayerWindow(newWindow);
        }
    };

    const closePlayerWindow = () => {
        if (isPlayerWindowOpen) {
            playerWindow?.close();
            playerWindowRef = null;
            setPlayerWindow(null);
            onPlayerWindowClose();
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
    const openCloseColor = isPlayerWindowOpen ? 'bg-wax-red hover:bg-wax-red/80' : 'bg-arcane-purple hover:bg-arcane-purple/80';

    // Show / Hide Button
    const showHideText = previewStatus === 'live' ? 'Hide From Players' : 'Show To Players';
    const isShowHideDisabled = !isPlayerWindowOpen || previewStatus === 'empty';
    const showHideColor = isShowHideDisabled
        ? 'bg-faded-ink/40 cursor-not-allowed opacity-50'
        : previewStatus === 'live'
            ? 'bg-wax-red hover:bg-wax-red/80'
            : 'bg-paladin-gold text-ink hover:bg-paladin-gold/80';

    // Focus Button
    const focusText = 'Focus Player Window';
    const isFocusDisabled = !isPlayerWindowOpen;
    const focusColor = isFocusDisabled
        ? 'bg-faded-ink/40 cursor-not-allowed opacity-50'
        : 'bg-arcane-purple hover:bg-arcane-purple/80';

    // Sync Button
    const syncText = 'Get Player View';
    const isSyncDisabled = !isPlayerWindowOpen;
    const syncColor = isSyncDisabled
        ? 'bg-faded-ink/40 cursor-not-allowed opacity-50'
        : 'bg-arcane-purple hover:bg-arcane-purple/80';

    return (
        <div className="leather-card flex w-full items-center gap-4 border-b border-paladin-gold/20 p-2">

            {/* 1. Open/Close Button */}
            <button
                onClick={handleOpenCloseClick}
                className={clsx('rounded px-4 py-2 font-bold text-parchment arcane-glow-hover border border-transparent', openCloseColor)}
            >
                {openCloseText}
            </button>

            {/* 2. Show/Hide Button */}
            <button
                onClick={handleShowHideClick}
                disabled={isShowHideDisabled}
                className={clsx('rounded px-4 py-2 font-bold text-parchment arcane-glow-hover border border-transparent', showHideColor)}
            >
                {showHideText}
            </button>

            {/* 3. Sync Button (New) */}
            <button
                onClick={onSyncWithPlayerClick}
                disabled={isSyncDisabled}
                className={clsx('rounded px-4 py-2 font-bold text-parchment arcane-glow-hover border border-transparent', syncColor)}
            >
                {syncText}
            </button>

            <div className="flex items-center gap-4">
                {/* 4. Focus Button */}
                <button
                    onClick={handleFocusClick}
                    disabled={isFocusDisabled}
                    className={clsx('rounded px-4 py-2 font-bold text-parchment arcane-glow-hover border border-transparent', focusColor)}
                >
                    {focusText}
                </button>

                {/* Instructional Text */}
                <div className="flex flex-col text-sm text-faded-ink">
                    <span>Focus + F11</span>
                    <span>For Full Screen</span>
                </div>
            </div>
            <div className="ml-auto"></div>
        </div>
    );
}