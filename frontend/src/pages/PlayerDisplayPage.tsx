// File: /src/pages/PlayerDisplayPage.tsx
import { useBroadcastChannel, BroadcastMessage} from '../hooks/useBroadcastChannel';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setCurrentContent, clearContent } from 'features/display/displaySlice';
import { DEFAULT_PLAYER_WINDOW_IMG } from 'config';

export default function PlayerDisplayPage() {
    // Get the dispatch function and select the state from the Redux store.
    const dispatch = useAppDispatch();
    const currentContent = useAppSelector((state) => state.display.currentContent);

    // The hook's callback will now dispatch an action to the Redux store.
    const handleMessage = (message: BroadcastMessage) => {
        if (message.type === 'show_image') {
            dispatch(setCurrentContent({ type: 'image', payload: message.payload }));
        }
        if (message.type === 'clear_display') {
            dispatch(clearContent());
        }
    };

    useBroadcastChannel('dmd-channel', handleMessage);

    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-black p-4 text-white">
            {!currentContent && (
                <figure>
                    <img
                        src={DEFAULT_PLAYER_WINDOW_IMG}
                        alt='nat 1'
                        // className="flex h-screen w-screen flex-col items-center justify-center "
                        className="max-h-[80vh] w-auto rounded-lg object-contain"
                    />
                </figure>
            )}
            {currentContent?.type === 'image' && (
                <figure>
                    <img
                        src={currentContent.payload.url}
                        alt={currentContent.payload.caption}
                        // className="flex h-screen w-screen flex-col items-center justify-center "
                        className="max-h-[80vh] w-auto rounded-lg object-contain"
                    />
                </figure>
            )}
        </div>
    );
}