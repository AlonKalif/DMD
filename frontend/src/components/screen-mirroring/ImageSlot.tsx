// /src/components/screen-mirroring/ImageSlot.tsx
import { useState, useCallback } from 'react';
import { ImageSlotState } from 'pages/ScreenMirroringPage';
import { useDrop, useDrag } from 'react-dnd';
import { ItemTypes } from './AssetPanel';
import { Document, Page } from 'react-pdf';
import clsx from 'clsx';

export const isPdfUrl = (url: string): boolean => url.toLowerCase().endsWith('.pdf');

interface AssetDropItem { id: number; url: string; }
interface SlotDropItem { sourceSlotId: number; }

interface ImageSlotProps {
    slot: ImageSlotState;
    onDropAsset: (slotId: number, item: AssetDropItem) => void;
    onClearSlot: (slotId: number) => void;
    onZoomChange: (slotId: number, direction: 'in' | 'out' | 'reset') => void;
    onPageChange: (slotId: number, direction: 'next' | 'prev', numPages: number) => void;
    onPositionChange: (slotId: number, direction: 'up' | 'down' | 'reset') => void;
    onMoveAsset: (sourceSlotId: number, targetSlotId: number) => void;
}

export function ImageSlot({ slot, onDropAsset, onClearSlot, onZoomChange, onPageChange, onPositionChange, onMoveAsset }: ImageSlotProps) {
    const [numPages, setNumPages] = useState<number>(1);

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    }, []);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.SLOT,
        item: { sourceSlotId: slot.slotId },
        canDrag: !!slot.url,
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }), [slot.slotId, slot.url]);

    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: [ItemTypes.ASSET, ItemTypes.SLOT],
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

    const isPdf = slot.url ? isPdfUrl(slot.url) : false;

    return (
        <div
            ref={drop}
            className={clsx(
                "group relative flex h-full w-full min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-md bg-leather-dark/50 p-2 transition-all border border-paladin-gold/10",
                isOver && canDrop && "ring-4 ring-arcane-purple",
                !isOver && canDrop && "ring-2 ring-dashed ring-faded-ink"
            )}
        >
            {slot.url ? (
                <>
                    {isPdf ? (
                        <div
                            ref={drag}
                            className={clsx(
                                "flex items-center justify-center max-h-full max-w-full overflow-hidden",
                                isDragging ? "cursor-grabbing opacity-50" : "cursor-grab"
                            )}
                            style={{ transform: `translateY(${slot.positionY}%)` }}
                        >
                            <Document
                                file={slot.url}
                                onLoadSuccess={onDocumentLoadSuccess}
                                loading={<div className="text-faded-ink text-sm">Loading PDF...</div>}
                                error={<div className="text-red-400 text-sm">Failed to load PDF</div>}
                            >
                                <Page
                                    pageNumber={slot.page}
                                    scale={slot.zoom}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                />
                            </Document>
                        </div>
                    ) : (
                        <img
                            ref={drag}
                            src={slot.url}
                            alt={`Staged content for slot ${slot.slotId + 1}`}
                            className={clsx(
                                "max-h-full max-w-full object-contain transition-transform duration-200",
                                isDragging ? "cursor-grabbing opacity-50" : "cursor-grab"
                            )}
                            style={{ transform: `scale(${slot.zoom}) translateY(${slot.positionY}%)` }}
                        />
                    )}

                    {/* Clear Button */}
                    <button
                        onClick={() => onClearSlot(slot.slotId)}
                        className="absolute top-1 right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                        title="Clear slot"
                    >
                        ✕
                    </button>

                    {/* Slot controls stack — bottom-right corner */}
                    <div className="absolute bottom-1 right-1 z-20 flex flex-col items-end space-y-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {/* Page Navigation (PDF only) */}
                        {isPdf && numPages > 1 && (
                            <div className="flex items-center space-x-1 rounded-full bg-black/50 p-1">
                                <button
                                    onClick={() => onPageChange(slot.slotId, 'prev', numPages)}
                                    disabled={slot.page <= 1}
                                    className="flex h-6 w-6 items-center justify-center rounded-full text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Previous Page"
                                >
                                    ◀
                                </button>
                                <span className="px-1 text-xs text-white select-none">
                                    {slot.page}/{numPages}
                                </span>
                                <button
                                    onClick={() => onPageChange(slot.slotId, 'next', numPages)}
                                    disabled={slot.page >= numPages}
                                    className="flex h-6 w-6 items-center justify-center rounded-full text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Next Page"
                                >
                                    ▶
                                </button>
                            </div>
                        )}

                        {/* Position Controls */}
                        <div className="flex items-center space-x-1 rounded-full bg-black/50 p-1">
                            <button onClick={() => onPositionChange(slot.slotId, 'up')} className="flex h-6 w-6 items-center justify-center rounded-full text-white hover:bg-gray-700" title="Move Up">▲</button>
                            <button onClick={() => onPositionChange(slot.slotId, 'reset')} className="flex h-6 w-auto items-center justify-center rounded-full px-1.5 text-white hover:bg-gray-700 text-[10px]" title="Reset Position">
                                ↕
                            </button>
                            <button onClick={() => onPositionChange(slot.slotId, 'down')} className="flex h-6 w-6 items-center justify-center rounded-full text-white hover:bg-gray-700" title="Move Down">▼</button>
                        </div>

                        {/* Zoom Controls */}
                        <div className="flex items-center space-x-1 rounded-full bg-black/50 p-1">
                            <button onClick={() => onZoomChange(slot.slotId, 'out')} className="flex h-6 w-6 items-center justify-center rounded-full text-white hover:bg-gray-700" title="Zoom Out">－</button>
                            <button onClick={() => onZoomChange(slot.slotId, 'reset')} className="flex h-6 w-auto items-center justify-center rounded-full px-2 text-white hover:bg-gray-700 text-xs" title="Reset Zoom">
                                {`${Math.round(slot.zoom * 100)}%`}
                            </button>
                            <button onClick={() => onZoomChange(slot.slotId, 'in')} className="flex h-6 w-6 items-center justify-center rounded-full text-white hover:bg-gray-700" title="Zoom In">＋</button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center text-faded-ink">
                    <span className="text-2xl font-bold">+</span>
                    <p className="font-display">Drop an asset here</p>
                </div>
            )}
        </div>
    );
}
