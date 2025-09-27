// File: /src/hooks/useBroadcastChannel.ts
import { useEffect, useMemo } from 'react';

// The structure of messages we'll send
export interface BroadcastMessage {
    type: string;
    payload?: any;
}

// Define the hook
export function useBroadcastChannel(
    channelName: string,
    onMessage: (message: BroadcastMessage) => void
) {
    // useMemo ensures the channel is only created once
    const channel = useMemo(() => new BroadcastChannel(channelName), [channelName]);

    useEffect(() => {
        // Set up the message handler
        channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
            onMessage(event.data);
        };

        // Clean up the listener when the component unmounts
        return () => {
            channel.onmessage = null;
        };
    }, [channel, onMessage]);

    return channel; // Return the channel so components can post messages
}