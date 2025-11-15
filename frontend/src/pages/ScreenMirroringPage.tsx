// /src/pages/ScreenMirroringPage.tsx
import {useState, useRef, useEffect} from 'react';
import { ScreenMirroringToolbar } from 'components/screen-mirroring/ScreenMirroringToolbar';
import { AssetPanel } from 'components/screen-mirroring/AssetPanel';
import { useBroadcastChannel, BroadcastMessage } from 'hooks/useBroadcastChannel';
import { StagingArea } from 'components/screen-mirroring/StagingArea';
import { API_BASE_URL } from 'config';
import { PresetLayout } from 'types/api';
import axios from 'axios';

export type LayoutType = 'single' | 'dual' | 'quad';
export type LayoutStatus = 'empty' | 'staged' | 'live';
export interface ImageSlotState { slotId: number; url: string | null; zoom: number; imageId: number | null;}
export interface LayoutState { layout: LayoutType; status: LayoutStatus; slots: ImageSlotState[]; }
interface DropItem { id: number; url: string; }

const createInitialLayoutState = (layout: LayoutType): LayoutState => {
    const slotCount = layout === 'quad' ? 4 : layout === 'dual' ? 2 : 1;
    return {
        layout,
        status: 'empty',
        slots: Array.from({ length: slotCount }, (_, i) => ({ slotId: i, url: null, zoom: 1, imageId: null })),
    };
};

export default function ScreenMirroringPage() {
    const [layoutState, setLayoutState] = useState<LayoutState>(() => createInitialLayoutState('single'));
    const [notification, setNotification] = useState<string | null>(null);
    const [isNotificationVisible, setIsNotificationVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [presetRefreshKey, setPresetRefreshKey] = useState(0);
    const notificationTimerRef = useRef<NodeJS.Timeout>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChannelMessage = (message: BroadcastMessage) => {
        if (message.type === 'response_current_content' && message.payload) {
            setLayoutState(message.payload as LayoutState);
        } else if(message.type === 'response_is_empty') { // Handles case where player window is open but empty
            if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
            setNotification('No Images Shown On Players Window.');
            setIsNotificationVisible(true);
            notificationTimerRef.current = setTimeout(() => setIsNotificationVisible(false), 2500);
        }
    };

    const channel = useBroadcastChannel('dmd-channel', handleChannelMessage);

    // This effect runs when the component mounts to automatically sync with an open player window.
    useEffect(() => {
        // As soon as the channel is ready, ask the player window for its current state.
        if (channel) {
            channel.postMessage({ type: 'request_current_content' });
        }
    }, [channel]); // The dependency array ensures this runs once the channel is initialized.

    const handleLayoutChange = (newLayout: LayoutType) => {
        setLayoutState(createInitialLayoutState(newLayout));
    };

    const handleDropAsset = (slotId: number, item: DropItem) => {
        setLayoutState(prevState => {
            const newSlots = [...prevState.slots];
            const targetSlot = newSlots.find(s => s.slotId === slotId);
            if (targetSlot) {
                targetSlot.url = item.url;
                targetSlot.imageId = item.id;
            }
            return { ...prevState, slots: newSlots, status: 'staged' };
        });
    };

    const handleClearSlot = (slotId: number) => {
        setLayoutState(prevState => {
            // Create a new slots array with the target slot cleared
            const newSlots = prevState.slots.map(s =>
                s.slotId === slotId ? { ...s, url: null, imageId: null } : s
            );

            // Check if any slots are still filled
            const isAnySlotStillFilled = newSlots.some(s => s.url !== null);

            return {
                ...prevState,
                slots: newSlots,
                // If no slots are filled, revert status to 'empty'
                status: isAnySlotStillFilled ? 'staged' : 'empty',
            };
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

    const handlePlayerWindowClose = () => {
        if (layoutState.status === 'live') {
            setLayoutState(prevState => ({ ...prevState, status: 'staged' }));
        }
    };

    const handleSyncWithPlayer = () => {
        channel.postMessage({ type: 'request_current_content' });
    };

    const handleZoomChange = (slotId: number, direction: 'in' | 'out' | 'reset') => {
        const ZOOM_INCREMENT = 0.1;

        setLayoutState(prevState => {
            const newSlots = prevState.slots.map(s => {
                if (s.slotId === slotId) {
                    let newZoom = s.zoom;
                    if (direction === 'in') {
                        newZoom += ZOOM_INCREMENT;
                    } else if (direction === 'out') {
                        newZoom = Math.max(0.1, newZoom - ZOOM_INCREMENT); // Prevent zooming out to zero or negative
                    } else {
                        newZoom = 1; // Reset to 100%
                    }
                    return { ...s, zoom: parseFloat(newZoom.toFixed(2)) }; // Keep precision to 2 decimal places
                }
                return s;
            });

            // If the layout is live, send an update to the player window immediately
            if (prevState.status === 'live') {
                const liveState = { ...prevState, slots: newSlots };
                channel.postMessage({ type: 'show_layout', payload: liveState });
            }

            return { ...prevState, slots: newSlots };
        });
    };

    const handleMoveAsset = (sourceSlotId: number, targetSlotId: number) => {
        // Prevent dropping an item onto itself
        if (sourceSlotId === targetSlotId) return;

        setLayoutState(prevState => {
            const newSlots = [...prevState.slots];
            const sourceSlot = newSlots.find(s => s.slotId === sourceSlotId);
            const targetSlot = newSlots.find(s => s.slotId === targetSlotId);

            if (sourceSlot && targetSlot) {
                // Swap the content (URL, zoom level, and imageId) between the two slots
                const sourceContent = { url: sourceSlot.url, zoom: sourceSlot.zoom, imageId: sourceSlot.imageId };
                const targetContent = { url: targetSlot.url, zoom: targetSlot.zoom, imageId: targetSlot.imageId };

                sourceSlot.url = targetContent.url;
                sourceSlot.zoom = targetContent.zoom;
                sourceSlot.imageId = targetContent.imageId;
                targetSlot.url = sourceContent.url;
                targetSlot.zoom = sourceContent.zoom;
                targetSlot.imageId = sourceContent.imageId;
            }

            // If the layout is live, send an update to the player window immediately
            if (prevState.status === 'live') {
                const liveState = { ...prevState, slots: newSlots };
                channel.postMessage({ type: 'show_layout', payload: liveState });
            }

            return { ...prevState, slots: newSlots };
        });
    };

    const handleSavePreset = async () => {
        setIsSaving(true);
        
        try {
            // Convert layoutState to PresetLayout format for backend (using snake_case)
            const presetData = {
                layout_type: layoutState.layout,
                slots: layoutState.slots
                    .filter(slot => slot.url !== null && slot.imageId !== null)
                    .map(slot => ({
                        image_id: slot.imageId,
                        slot_id: slot.slotId,
                        zoom: slot.zoom,
                    })),
            };

            await axios.post(`${API_BASE_URL}/api/v1/images/presets`, presetData);
            
            // Trigger preset refresh
            setPresetRefreshKey(key => key + 1);
            
            // Keep green flash for 500ms
            setTimeout(() => {
                setIsSaving(false);
            }, 500);
        } catch (error) {
            console.error('Failed to save preset:', error);
            setIsSaving(false);
        }
    };

    const handleLoadPreset = (preset: PresetLayout) => {
        // Convert PresetLayout to LayoutState format
        const slotCount = preset.layout_type === 'quad' ? 4 : preset.layout_type === 'dual' ? 2 : 1;
        
        // Create initial empty slots
        const newSlots: ImageSlotState[] = Array.from({ length: slotCount }, (_, i) => ({
            slotId: i,
            url: null,
            zoom: 1,
            imageId: null,
        }));

        // Fill in slots from preset (with safety check)
        const presetSlots = preset.slots || [];
        presetSlots.forEach(presetSlot => {
            const slot = newSlots.find(s => s.slotId === presetSlot.slot_id);
            if (slot && presetSlot.image) {
                slot.url = `${API_BASE_URL}/static/${presetSlot.image.file_path.replace(/^public\//, '')}`;
                slot.zoom = presetSlot.zoom;
                slot.imageId = presetSlot.image_id;
            }
        });

        setLayoutState({
            layout: preset.layout_type,
            status: 'staged',
            slots: newSlots,
        });
    };

    const handleDeletePreset = async (id: number) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/v1/images/presets/${id}`);
            // Trigger preset refresh
            setPresetRefreshKey(key => key + 1);
        } catch (error) {
            console.error('Failed to delete preset:', error);
        }
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
            <AssetPanel
                onBrowseClick={() => fileInputRef.current?.click()}
                onLoadPreset={handleLoadPreset}
                onDeletePreset={handleDeletePreset}
                presetRefreshKey={presetRefreshKey}
            />
            <main className="flex flex-1 min-h-0 items-center justify-center bg-gray-900 p-4">
                <input type="file" ref={fileInputRef} onChange={() => {}} className="hidden" accept="image/*,video/*" />
                <StagingArea
                    layoutState={layoutState}
                    onLayoutChange={handleLayoutChange}
                    onDropAsset={handleDropAsset}
                    onClearSlot={handleClearSlot}
                    onZoomChange={handleZoomChange}
                    onMoveAsset={handleMoveAsset}
                    onSavePreset={handleSavePreset}
                    isSaving={isSaving}
                    notification={notification}
                    isNotificationVisible={isNotificationVisible}
                />
            </main>
        </div>
    );
}