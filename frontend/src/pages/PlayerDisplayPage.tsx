// File: /src/pages/PlayerDisplayPage.tsx
import {
    useBroadcastChannel,
    BroadcastMessage,
} from '../hooks/useBroadcastChannel';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setCurrentContent, clearContent } from 'features/display/displaySlice';

export default function PlayerDisplayPage() {
    // Get the dispatch function and select the state from the Redux store.
    const defaultPlayerImage = '/images/Red_Dragon_5eR.webp';
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
                // <h1 className="text-4xl font-bold">Player Window</h1>
              <img src={defaultPlayerImage}/>
            )}
            {currentContent?.type === 'image' && (
                <figure>
                    <img
                        src={currentContent.payload.url}
                        alt={currentContent.payload.caption}
                        className="max-h-[80vh] w-auto rounded-lg object-contain"
                    />
                    <figcaption className="mt-4 text-center text-2xl italic">
                        {currentContent.payload.caption}
                    </figcaption>
                </figure>
            )}
        </div>
    );
}