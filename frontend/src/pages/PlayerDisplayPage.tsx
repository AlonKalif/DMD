// /src/pages/PlayerDisplayPage.tsx
import { useCallback, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { BroadcastMessage } from '../hooks/useBroadcastChannel';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setCurrentLayout, clearLayout } from 'features/display/displaySlice';
import { DEFAULT_PLAYER_WINDOW_IMG } from 'config';
import { LayoutState } from './ScreenMirroringPage';

export default function PlayerDisplayPage() {
    const dispatch = useAppDispatch();
    const currentLayout = useAppSelector((state) => state.display.currentLayout);

    const channel = useMemo(() => new BroadcastChannel('dmd-channel'), []);

    const handleBroadcastMessage = useCallback((message: BroadcastMessage) => {
        if (message.type === 'show_layout') {
            dispatch(setCurrentLayout(message.payload as LayoutState));
        }
        if (message.type === 'clear_layout') {
            dispatch(clearLayout());
        }
        if (message.type === 'request_current_content') {
            if (currentLayout) {
                channel.postMessage({
                    type: 'response_current_content',
                    payload: currentLayout,
                });
            } else {
                // Respond that the window is empty
                channel.postMessage({ type: 'response_is_empty' });
            }
        }
    }, [dispatch, currentLayout, channel]);

    useEffect(() => {
        const handler = (event: MessageEvent<BroadcastMessage>) => {
            handleBroadcastMessage(event.data);
        };
        channel.onmessage = handler;
        return () => { channel.onmessage = null; };
    }, [channel, handleBroadcastMessage]);

    // Define grid classes based on the layout type
    const gridClasses = {
        single: 'grid-cols-1 grid-rows-1',
        dual: 'grid-cols-2 grid-rows-1',
        quad: 'grid-cols-2 grid-rows-2',
    };

    return (
        <div id="player-root-container" className="flex h-screen w-screen items-center justify-center bg-black p-4">
            {!currentLayout ? (
                // Default view when no layout is active
                <img
                    src={DEFAULT_PLAYER_WINDOW_IMG}
                    alt="Player display waiting for content"
                    className="max-h-[80vh] w-auto rounded-lg object-contain"
                />
            ) : (
                // Dynamic grid rendering
                <div className={clsx('grid h-full w-full gap-2', gridClasses[currentLayout.layout])}>
                    {currentLayout.slots.map(({ slotId, url }) => (
                        <div key={slotId} className="flex h-full w-full items-center justify-center rounded-lg bg-gray-900">
                            {url ? (
                                <img
                                    src={url}
                                    alt={`Content for slot ${slotId + 1}`}
                                    className="max-h-full max-w-full object-contain"
                                />
                            ) : null}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}