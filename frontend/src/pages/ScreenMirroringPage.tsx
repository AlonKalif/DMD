// /src/pages/ScreenMirroringPage.tsx
import { useState, useRef } from 'react';
import { ScreenMirroringToolbar } from 'components/screen-mirroring/ScreenMirroringToolbar';
import { AssetSelectionBar } from 'components/screen-mirroring/AssetSelectionBar';
import { useBroadcastChannel, BroadcastMessage } from 'hooks/useBroadcastChannel';
import { useAppSelector } from 'app/hooks';
import { StagingArea } from 'components/screen-mirroring/StagingArea';

export type LayoutType = 'single' | 'dual' | 'quad';
export type LayoutStatus = 'empty' | 'staged' | 'live';
export interface ImageSlotState { slotId: number; url: string | null; }
export interface LayoutState { layout: LayoutType; status: LayoutStatus; slots: ImageSlotState[]; }
interface DropItem { id: number; url: string; }

const createInitialLayoutState = (layout: LayoutType): LayoutState => {
    const slotCount = layout === 'quad' ? 4 : layout === 'dual' ? 2 : 1;
    return {
        layout,
        status: 'empty',
        slots: Array.from({ length: slotCount }, (_, i) => ({ slotId: i, url: null })),
    };
};

export default function ScreenMirroringPage() {
    const [layoutState, setLayoutState] = useState<LayoutState>(() => createInitialLayoutState('single'));
    const [notification, setNotification] = useState<string | null>(null);
    const [isNotificationVisible, setIsNotificationVisible] = useState(false);
    const notificationTimerRef = useRef<NodeJS.Timeout>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const assets = useAppSelector((state) => state.images.items);

    const handleChannelMessage = (message: BroadcastMessage) => {
        if (message.type === 'response_current_content' && message.payload) {
            setLayoutState(message.payload as LayoutState);
        } else if (message.type === 'response_current_content' && !message.payload) { // Handles case where player window is open but empty
            if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
            setNotification('Player window is clear. Nothing to sync.');
            setIsNotificationVisible(true);
            notificationTimerRef.current = setTimeout(() => setIsNotificationVisible(false), 2500);
        }
    };

    const channel = useBroadcastChannel('dmd-channel', handleChannelMessage);

    const handleLayoutChange = (newLayout: LayoutType) => {
        setLayoutState(createInitialLayoutState(newLayout));
    };

    const handleDropAsset = (slotId: number, item: DropItem) => {
        setLayoutState(prevState => {
            const newSlots = [...prevState.slots];
            const targetSlot = newSlots.find(s => s.slotId === slotId);
            if (targetSlot) {
                targetSlot.url = item.url;
            }
            return { ...prevState, slots: newSlots, status: 'staged' };
        });
    };

    const handleShowToPlayers = () => {
        const isAnySlotFilled = layoutState.slots.some(slot => slot.url);
        if (layoutState.status === 'staged' && isAnySlotFilled) {
            const liveState = { ...layoutState, status: 'live' as LayoutStatus };
            channel.postMessage({ type: 'show_layout', payload: liveState });
            setLayoutState(liveState);
        }
    };

    const handleHideFromPlayers = () => {
        if (layoutState.status === 'live') {
            channel.postMessage({ type: 'clear_layout' });
            setLayoutState({ ...layoutState, status: 'staged' });
        }
    };

    // --- THE FIX ---
    // This handler contains the logic to revert the status from 'live' to 'staged'.
    const handlePlayerWindowClose = () => {
        if (layoutState.status === 'live') {
            setLayoutState(prevState => ({ ...prevState, status: 'staged' }));
        }
    };
    // --- END FIX ---

    const handleSyncWithPlayer = () => {
        channel.postMessage({ type: 'request_current_content' });
    };

    return (
        <div className="flex h-screen flex-col">
            <ScreenMirroringToolbar
                previewStatus={layoutState.status}
                onShowToPlayersClick={handleShowToPlayers}
                onHideFromPlayersClick={handleHideFromPlayers}
                onPlayerWindowClose={handlePlayerWindowClose}
                onSyncWithPlayerClick={handleSyncWithPlayer}
            />
            <AssetSelectionBar
                assets={assets}
                onBrowseClick={() => fileInputRef.current?.click()}
            />
            <main className="flex flex-1 min-h-0 items-center justify-center bg-gray-900 p-4">
                <input type="file" ref={fileInputRef} onChange={() => {}} className="hidden" accept="image/*,video/*" />
                <StagingArea
                    layoutState={layoutState}
                    onLayoutChange={handleLayoutChange}
                    onDropAsset={handleDropAsset}
                    notification={notification}
                    isNotificationVisible={isNotificationVisible}
                />
            </main>
        </div>
    );
}