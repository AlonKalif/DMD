import { useEffect, useState } from 'react';
import clsx from 'clsx';

type PreviewStatus = 'empty' | 'staged' | 'live';

interface ScreenMirroringToolbarProps {
    previewStatus: PreviewStatus;
    onShowToPlayersClick: () => void;
    onHideFromPlayersClick: () => void;
    onPlayerWindowClose: () => void;
}

export function ScreenMirroringToolbar({
                                           previewStatus,
                                           onShowToPlayersClick,
                                           onHideFromPlayersClick,
                                           onPlayerWindowClose,
                                       }: ScreenMirroringToolbarProps) {
    const [playerWindow, setPlayerWindow] = useState<Window | null>(null);
    const isPlayerWindowOpen = playerWindow && !playerWindow.closed;

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

    const openOrFocusPlayerWindow = () => {
        if (isPlayerWindowOpen) {
            playerWindow?.focus();
            return;
        }
        const newWindow = window.open('/player', 'dmdPlayerWindow', 'popup,width=1280,height=720');
        setPlayerWindow(newWindow);
    };

    const handlePrimaryActionClick = () => {
        if (previewStatus === 'live' && isPlayerWindowOpen) {
            onHideFromPlayersClick();
            return;
        }

        if (previewStatus === 'staged') {
            const wasOpen = isPlayerWindowOpen;
            openOrFocusPlayerWindow();

            if (wasOpen) {
                onShowToPlayersClick();
            } else {
                setTimeout(onShowToPlayersClick, 200);
            }
        }
    };

    const isShowingLive = previewStatus === 'live' && isPlayerWindowOpen;
    const buttonText = isShowingLive ? 'Hide from Players' : 'Show to Players';
    const isButtonDisabled = previewStatus === 'empty';

    return (
        <div className="flex w-full items-center gap-4 border-b border-gray-700 bg-gray-800 p-2">
            <button
                onClick={handlePrimaryActionClick}
                disabled={isButtonDisabled}
                className={clsx(
                    'rounded px-4 py-2 font-bold text-white',
                    isShowingLive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700',
                    isButtonDisabled && 'cursor-not-allowed opacity-50'
                )}
            >
                {buttonText}
            </button>

            {/* The right side of the toolbar is now empty */}
            <div className="ml-auto"></div>
        </div>
    );
}