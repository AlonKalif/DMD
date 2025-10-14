// /src/components/screen-mirroring/ImageSlot.tsx
import { ImageSlotState } from 'pages/ScreenMirroringPage';
import { useDrop } from 'react-dnd';
import { ItemTypes } from './AssetSelectionBar';
import clsx from 'clsx';

interface DropItem { id: number; url: string; }

interface ImageSlotProps {
    slot: ImageSlotState;
    onDropAsset: (slotId: number, item: DropItem) => void;
    onClearSlot: (slotId: number) => void;
    onZoomChange: (slotId: number, direction: 'in' | 'out' | 'reset') => void;
}

export function ImageSlot({ slot, onDropAsset, onClearSlot , onZoomChange }: ImageSlotProps) {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: ItemTypes.ASSET,
        drop: (item: DropItem) => onDropAsset(slot.slotId, item),
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    }));

    return (
        <div
            ref={drop}
            // Group class to enable hover effects on child elements
            className={clsx(
                "group relative flex h-full w-full min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-md bg-gray-800/50 p-2 transition-all",
                isOver && canDrop && "ring-4 ring-blue-500",
                !isOver && canDrop && "ring-2 ring-dashed ring-gray-500"
            )}
        >
            {slot.url ? (
                <>
                    <img
                        src={slot.url}
                        alt={`Staged content for slot ${slot.slotId + 1}`}
                        className="max-h-full max-w-full object-contain"
                        style={{ transform: `scale(${slot.zoom})` }}
                    />
                    {/* Clear Button */}
                    <button
                        onClick={() => onClearSlot(slot.slotId)}
                        className="absolute top-1 right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                        title="Clear slot"
                    >
                        ✕
                    </button>

                    {/* Zoom Controls */}
                    <div className="absolute bottom-1 right-1 z-20 flex items-center space-x-1 rounded-full bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => onZoomChange(slot.slotId, 'out')} className="flex h-6 w-6 items-center justify-center rounded-full text-white hover:bg-gray-700" title="Zoom Out">－</button>
                        <button onClick={() => onZoomChange(slot.slotId, 'reset')} className="flex h-6 w-auto items-center justify-center rounded-full px-2 text-white hover:bg-gray-700 text-xs" title="Reset Zoom">
                            {/* **FIX #2: Display the dynamic zoom percentage** */}
                            {`${Math.round(slot.zoom * 100)}%`}
                        </button>
                        <button onClick={() => onZoomChange(slot.slotId, 'in')} className="flex h-6 w-6 items-center justify-center rounded-full text-white hover:bg-gray-700" title="Zoom In">＋</button>
                    </div>
                </>
            ) : (
                <div className="text-center text-gray-500">
                    <span className="text-2xl font-bold">+</span>
                    <p>Drop an asset here</p>
                </div>
            )}
        </div>
    );
}