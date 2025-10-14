// /src/components/screen-mirroring/ImageSlot.tsx
import { ImageSlotState } from 'pages/ScreenMirroringPage';
import { useDrop } from 'react-dnd';
import { ItemTypes } from './AssetSelectionBar';
import clsx from 'clsx';

// The item type we expect to receive when dropped
interface DropItem {
    id: number;
    url: string;
}

interface ImageSlotProps {
    slot: ImageSlotState;
    onDropAsset: (slotId: number, item: DropItem) => void;
}

export function ImageSlot({ slot, onDropAsset }: ImageSlotProps) {
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
            className={clsx(
                "flex h-full w-full min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-md bg-gray-800/50 p-2 transition-all",
                isOver && canDrop && "ring-4 ring-blue-500",
                !isOver && canDrop && "ring-2 ring-dashed ring-gray-500"
            )}
        >
            {slot.url ? (
                <img
                    src={slot.url}
                    alt={`Staged content for slot ${slot.slotId + 1}`}
                    className="max-h-full max-w-full object-contain"
                />
            ) : (
                <div className="text-center text-gray-500">
                    <span className="text-2xl font-bold">+</span>
                    <p>Drop an asset here</p>
                </div>
            )}
        </div>
    );
}