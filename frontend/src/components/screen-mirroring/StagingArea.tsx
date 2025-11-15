// /src/components/screen-mirroring/StagingArea.tsx

import clsx from 'clsx';
import { LayoutState, LayoutType } from 'pages/ScreenMirroringPage';
import { LayoutSelector } from './LayoutSelector';
import { ImageSlot } from './ImageSlot';

interface DropItem { id: number; url: string; }

interface StagingAreaProps {
    layoutState: LayoutState;
    onLayoutChange: (layout: LayoutType) => void;
    onDropAsset: (slotId: number, item: DropItem) => void;
    onClearSlot: (slotId: number) => void;
    onZoomChange: (slotId: number, direction: 'in' | 'out' | 'reset') => void;
    onMoveAsset: (sourceSlotId: number, targetSlotId: number) => void;
    onSavePreset: () => void;
    isSaving: boolean;
    notification: string | null;
    isNotificationVisible: boolean;
}

export function StagingArea({ layoutState, onLayoutChange, onDropAsset, onClearSlot, onZoomChange, onMoveAsset, onSavePreset, isSaving, notification, isNotificationVisible  }: StagingAreaProps) {
    const { layout, status, slots } = layoutState;

    // Dynamic grid classes based on the layout
    const gridClasses = {
        single: 'grid-cols-1 grid-rows-1',
        dual: 'grid-cols-2 grid-rows-1',
        quad: 'grid-cols-2 grid-rows-2',
    };

    return (
        <div className={clsx(
            'relative flex h-full w-full items-center justify-center rounded-lg border-4 p-2 transition-colors duration-300',
            status === 'empty' && 'border-gray-600 border-dashed',
            status === 'staged' && !isSaving && 'border-blue-500 border-solid',
            status === 'live' && !isSaving && 'border-green-500 border-solid',
            isSaving && 'border-green-500 border-solid',
        )}>
            {/* Notification Banner */}
            <div className={clsx(
                'absolute top-0 left-1/4 right-1/4 bg-blue-800/95 p-2 text-center font-semibold text-white shadow-lg transition-opacity duration-300 ease-in-out z-20 rounded-b-lg',
                isNotificationVisible ? 'opacity-97' : 'opacity-0'
            )}>
                {notification}
            </div>
            {/* Layout Selector with Save Preset button in the top-left corner */}
            <div className="absolute top-2 left-2 z-10">
                <LayoutSelector 
                    currentLayout={layout} 
                    onSelectLayout={onLayoutChange}
                    onSavePreset={onSavePreset}
                    status={status}
                />
            </div>

            {/* Status Badge in the top-center */}
            {status !== 'empty' && (
                <div className={clsx(
                    'absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3/4 transform rounded px-3 py-0.1 text-sm font-bold text-white z-10',
                    status === 'staged' && 'bg-blue-500',
                    status === 'live' && 'bg-green-500',
                )}>
                    {status.toUpperCase()}
                </div>
            )}

            {/* Main grid for the image slots */}
            <div className={clsx('grid h-full w-full gap-2', gridClasses[layout])}>
                {slots.map((slot) => (
                    <ImageSlot
                        key={slot.slotId}
                        slot={slot}
                        onDropAsset={onDropAsset}
                        onClearSlot={onClearSlot}
                        onZoomChange={onZoomChange}
                        onMoveAsset={onMoveAsset}
                    />
                ))}
            </div>
        </div>
    );
}