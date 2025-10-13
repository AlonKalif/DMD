// File: /src/pages/PlayerDisplayPage.tsx
import { useCallback } from 'react'; // Only need useEffect and useCallback
import { useBroadcastChannel, BroadcastMessage} from '../hooks/useBroadcastChannel';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setCurrentContent, clearContent } from 'features/display/displaySlice';
import { DEFAULT_PLAYER_WINDOW_IMG } from 'config';

export default function PlayerDisplayPage() {
    const dispatch = useAppDispatch();
    const currentContent = useAppSelector((state) => state.display.currentContent);

    // --- Broadcast Channel Message Handler (Content Only) ---
    const handleBroadcastMessage = useCallback((message: BroadcastMessage) => {
        if (message.type === 'show_image') {
            dispatch(setCurrentContent({ type: 'image', payload: message.payload }));
        }
        if (message.type === 'clear_display') {
            dispatch(clearContent());
        }
    }, [dispatch]);

    // Use the Broadcast Channel for content synchronization
    // We no longer need to report status back.
    useBroadcastChannel('dmd-channel', handleBroadcastMessage);


    // All fullscreen-related states and effects (showPrompt, reportFullscreenStatus,
    // and listeners for 'fullscreenchange' and 'window.postMessage') are removed.

    return (
        <div
            id="player-root-container"
            className="flex h-screen w-screen flex-col items-center justify-center bg-black p-4 text-white"
        >
            {!currentContent && (
                <figure>
                    <img
                        src={DEFAULT_PLAYER_WINDOW_IMG}
                        alt='nat 1'
                        className="max-h-[80vh] w-auto rounded-lg object-contain"
                    />
                </figure>
            )}
            {currentContent?.type === 'image' && (
                <figure>
                    <img
                        src={currentContent.payload.url}
                        alt={currentContent.payload.caption}
                        className="max-h-[80vh] w-auto rounded-lg object-contain"
                    />
                </figure>
            )}
        </div>
    );
}