// /src/components/screen-mirroring/ImageSlot.tsx
import { ImageSlotState } from 'pages/ScreenMirroringPage';
import { useDrop, useDrag } from 'react-dnd';
import { ItemTypes } from './AssetSelectionBar';
import clsx from 'clsx';

interface AssetDropItem { id: number; url: string; }
interface SlotDropItem { sourceSlotId: number; }

interface ImageSlotProps {
    slot: ImageSlotState;
    onDropAsset: (slotId: number, item: AssetDropItem) => void;
    onClearSlot: (slotId: number) => void;
    onZoomChange: (slotId: number, direction: 'in' | 'out' | 'reset') => void;
    onMoveAsset: (sourceSlotId: number, targetSlotId: number) => void;
}

export function ImageSlot({ slot, onDropAsset, onClearSlot , onZoomChange, onMoveAsset }: ImageSlotProps) {
    // --- DRAG LOGIC: Make the slot a drag source if it has an image ---
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.SLOT,
        item: { sourceSlotId: slot.slotId },
        canDrag: !!slot.url, // You can only drag if the slot is not empty
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }), [slot.slotId, slot.url]); // Dependencies

    // --- DROP LOGIC: Update to accept both ASSET and SLOT types ---
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: [ItemTypes.ASSET, ItemTypes.SLOT], // Accept both types
        drop: (item: AssetDropItem | SlotDropItem, monitor) => {
            const itemType = monitor.getItemType();
            if (itemType === ItemTypes.ASSET) {
                onDropAsset(slot.slotId, item as AssetDropItem);
            } else if (itemType === ItemTypes.SLOT) {
                onMoveAsset((item as SlotDropItem).sourceSlotId, slot.slotId);
            }
        },
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
                        ref={drag} // Attach the drag ref to the image
                        src={slot.url}
                        alt={`Staged content for slot ${slot.slotId + 1}`}
                        className={clsx(
                            "max-h-full max-w-full object-contain transition-transform duration-200",
                            isDragging ? "cursor-grabbing opacity-50" : "cursor-grab"
                        )}
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