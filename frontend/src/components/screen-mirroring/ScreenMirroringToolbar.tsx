import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { LayoutStatus } from 'pages/ScreenMirroringPage';

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
        if (isPlayerWindowOpen) closePlayerWindow();
        else openPlayerWindow();
    };

    const handleShowHideClick = () => {
        if (previewStatus === 'live') onHideFromPlayersClick();
        else if (previewStatus === 'staged') onShowToPlayersClick();
    };

    const handleFocusClick = () => {
        if (isPlayerWindowOpen && playerWindow) playerWindow.focus();
    };

    const isShowHideDisabled = !isPlayerWindowOpen || previewStatus === 'empty';
    const isFocusDisabled = !isPlayerWindowOpen;
    const isSyncDisabled = !isPlayerWindowOpen;

    return (
        <div className="leather-card flex w-full items-center gap-1.5 border-b border-paladin-gold/20 px-2 py-1">
            {/* Open/Close */}
            <button
                onClick={handleOpenCloseClick}
                className={clsx(
                    'rounded p-1.5 text-parchment transition-colors',
                    isPlayerWindowOpen ? 'bg-wax-red hover:bg-wax-red/80' : 'bg-arcane-purple hover:bg-arcane-purple/80'
                )}
                title={isPlayerWindowOpen ? 'Close Players Window' : 'Open Players Window'}
            >
                {isPlayerWindowOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                )}
            </button>

            {/* Show/Hide */}
            <button
                onClick={handleShowHideClick}
                disabled={isShowHideDisabled}
                className={clsx(
                    'rounded p-1.5 text-parchment transition-colors',
                    isShowHideDisabled
                        ? 'bg-faded-ink/40 cursor-not-allowed opacity-50'
                        : previewStatus === 'live'
                            ? 'bg-wax-red hover:bg-wax-red/80'
                            : 'bg-paladin-gold text-ink hover:bg-paladin-gold/80'
                )}
                title={previewStatus === 'live' ? 'Hide From Players' : 'Show To Players'}
            >
                {previewStatus === 'live' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                )}
            </button>

            {/* Sync */}
            <button
                onClick={onSyncWithPlayerClick}
                disabled={isSyncDisabled}
                className={clsx(
                    'rounded p-1.5 text-parchment transition-colors',
                    isSyncDisabled ? 'bg-faded-ink/40 cursor-not-allowed opacity-50' : 'bg-arcane-purple hover:bg-arcane-purple/80'
                )}
                title="Sync With Player"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>

            {/* Focus */}
            <button
                onClick={handleFocusClick}
                disabled={isFocusDisabled}
                className={clsx(
                    'rounded p-1.5 text-parchment transition-colors',
                    isFocusDisabled ? 'bg-faded-ink/40 cursor-not-allowed opacity-50' : 'bg-arcane-purple hover:bg-arcane-purple/80'
                )}
                title="Focus Player Window (then F11 for fullscreen)"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
            </button>

            <div className="ml-auto flex items-center gap-2">
                <img src="/dmd_logo.png" alt="DMD" className="logo-gold h-6 w-6" />
                <span className="text-xs font-blackletter gold-gradient-text tracking-wide">DM Dashboard</span>
            </div>
        </div>
    );
}
