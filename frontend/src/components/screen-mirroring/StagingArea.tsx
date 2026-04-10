// /src/components/screen-mirroring/StagingArea.tsx

import { useRef, useState, useEffect } from 'react';
import clsx from 'clsx';
import { LayoutState, LayoutType } from 'pages/ScreenMirroringPage';
import { LayoutSelector } from './LayoutSelector';
import { ImageSlot } from './ImageSlot';

interface DropItem { id: number; url: string; }

const ASPECT_RATIO = 16 / 9;

interface StagingAreaProps {
    layoutState: LayoutState;
    onLayoutChange: (layout: LayoutType) => void;
    onDropAsset: (slotId: number, item: DropItem) => void;
    onClearSlot: (slotId: number) => void;
    onZoomChange: (slotId: number, direction: 'in' | 'out' | 'reset') => void;
    onPageChange: (slotId: number, direction: 'next' | 'prev', numPages: number) => void;
    onPositionChange: (slotId: number, direction: 'up' | 'down' | 'reset') => void;
    onMoveAsset: (sourceSlotId: number, targetSlotId: number) => void;
    onSavePreset: () => void;
    isSaving: boolean;
    notification: string | null;
    isNotificationVisible: boolean;
}

export function StagingArea({ layoutState, onLayoutChange, onDropAsset, onClearSlot, onZoomChange, onPageChange, onPositionChange, onMoveAsset, onSavePreset, isSaving, notification, isNotificationVisible  }: StagingAreaProps) {
    const { layout, status, slots } = layoutState;
    const containerRef = useRef<HTMLDivElement>(null);
    const [boxSize, setBoxSize] = useState<{ width: number; height: number } | null>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const computeSize = () => {
            const w = el.clientWidth;
            const h = el.clientHeight;
            if (w === 0 || h === 0) return;

            if (w / h > ASPECT_RATIO) {
                setBoxSize({ width: Math.floor(h * ASPECT_RATIO), height: h });
            } else {
                setBoxSize({ width: w, height: Math.floor(w / ASPECT_RATIO) });
            }
        };

        computeSize();
        const observer = new ResizeObserver(computeSize);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const gridClasses = {
        single: 'grid-cols-1 grid-rows-1',
        dual: 'grid-cols-2 grid-rows-1',
        quad: 'grid-cols-2 grid-rows-2',
    };

    return (
        <div ref={containerRef} className="flex h-full w-full items-center justify-center">
            <div
                className={clsx(
                    'relative flex items-center justify-center rounded-lg border-4 p-2 transition-colors duration-300',
                    status === 'empty' && 'border-faded-ink/40 border-dashed',
                    status === 'staged' && !isSaving && 'border-arcane-purple border-solid',
                    status === 'live' && !isSaving && 'border-paladin-gold border-solid',
                    isSaving && 'border-paladin-gold border-solid',
                )}
                style={boxSize ? { width: boxSize.width, height: boxSize.height } : { width: '100%', height: '100%' }}
            >
                {/* Notification Banner */}
                <div className={clsx(
                    'absolute top-0 left-1/4 right-1/4 leather-card p-2 text-center font-semibold text-parchment shadow-lg transition-opacity duration-300 ease-in-out z-20 rounded-b-lg',
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
                        'absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3/4 transform rounded px-3 py-0.1 text-sm font-bold font-blackletter text-parchment z-10',
                        status === 'staged' && 'bg-arcane-purple',
                        status === 'live' && 'bg-paladin-gold text-ink',
                    )}>
                        {status.toUpperCase()}
                    </div>
                )}

                {/* Background logo watermark */}
                <img
                    src="/dmd_logo.png"
                    alt=""
                    aria-hidden="true"
                    className="logo-gold pointer-events-none absolute inset-0 m-auto h-[110%] w-auto opacity-[0.12] select-none"
                />

                {/* Main grid for the image slots */}
                <div className={clsx('relative z-[1] grid h-full w-full gap-2', gridClasses[layout])}>
                    {slots.map((slot) => (
                        <ImageSlot
                            key={slot.slotId}
                            slot={slot}
                            onDropAsset={onDropAsset}
                            onClearSlot={onClearSlot}
                            onZoomChange={onZoomChange}
                            onPageChange={onPageChange}
                            onPositionChange={onPositionChange}
                            onMoveAsset={onMoveAsset}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
