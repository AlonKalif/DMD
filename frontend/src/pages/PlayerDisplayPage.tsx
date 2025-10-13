// File: /src/pages/PlayerDisplayPage.tsx
import { useCallback, useEffect, useMemo } from 'react';
import { BroadcastMessage} from '../hooks/useBroadcastChannel';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setCurrentContent, clearContent } from 'features/display/displaySlice';
import { DEFAULT_PLAYER_WINDOW_IMG } from 'config';

export default function PlayerDisplayPage() {
    const dispatch = useAppDispatch();
    const currentContent = useAppSelector((state) => state.display.currentContent);

    const channel = useMemo(() => new BroadcastChannel('dmd-channel'), []);

    const handleBroadcastMessage = useCallback((message: BroadcastMessage) => {
        if (message.type === 'show_image') {
            dispatch(setCurrentContent({ type: 'image', payload: message.payload }));
        }
        if (message.type === 'clear_display') {
            dispatch(clearContent());
        }
        if (message.type === 'request_current_content') {
            if (currentContent) {
                channel.postMessage({
                    type: 'response_current_content',
                    payload: currentContent.payload,
                });
            } else {
                // Respond that the window is empty
                channel.postMessage({ type: 'response_is_empty' });
            }
        }
    }, [dispatch, currentContent, channel]);

    useEffect(() => {
        const handler = (event: MessageEvent<BroadcastMessage>) => {
            handleBroadcastMessage(event.data);
        };

        channel.onmessage = handler;

        // Cleanup function to remove the listener when the component unmounts
        return () => {
            channel.onmessage = null;
        };
    }, [channel, handleBroadcastMessage]);


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