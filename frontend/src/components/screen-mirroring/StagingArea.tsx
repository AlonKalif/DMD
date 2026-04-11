// /src/components/screen-mirroring/StagingArea.tsx

import { useRef, useState, useEffect } from 'react';
import clsx from 'clsx';
import { useDrop } from 'react-dnd';
import { LayoutState, LayoutType } from 'pages/ScreenMirroringPage';
import { BattleDisplayPayload, PresetLayout } from 'types/api';
import { ItemTypes } from './AssetPanel';
import { LayoutSelector } from './LayoutSelector';
import { ImageSlot } from './ImageSlot';
import { PlayerBattleView } from 'components/crawl/PlayerBattleView';

interface DropItem { id: number; url: string; }
interface PresetDropItem { preset: PresetLayout; }

const ASPECT_RATIO = 16 / 9;

interface StagingAreaProps {
    layoutState: LayoutState;
    onLayoutChange: (layout: LayoutType) => void;
    onDropAsset: (slotId: number, item: DropItem) => void;
    onDropAssetToFirstSlot: (item: DropItem) => void;
    onLoadPreset: (preset: PresetLayout) => void;
    onClearSlot: (slotId: number) => void;
    onZoomChange: (slotId: number, direction: 'in' | 'out' | 'reset') => void;
    onPageChange: (slotId: number, direction: 'next' | 'prev', numPages: number) => void;
    onPositionChange: (slotId: number, direction: 'up' | 'down' | 'reset') => void;
    onMoveAsset: (sourceSlotId: number, targetSlotId: number) => void;
    onSavePreset: () => void;
    isSaving: boolean;
    notification: string | null;
    isNotificationVisible: boolean;
    battlePreview: BattleDisplayPayload | null;
}

export function StagingArea({ layoutState, onLayoutChange, onDropAsset, onDropAssetToFirstSlot, onLoadPreset, onClearSlot, onZoomChange, onPageChange, onPositionChange, onMoveAsset, onSavePreset, isSaving, notification, isNotificationVisible, battlePreview }: StagingAreaProps) {
    const { layout, status, slots } = layoutState;
    const containerRef = useRef<HTMLDivElement>(null);
    const [boxSize, setBoxSize] = useState<{ width: number; height: number } | null>(null);

    const [{ isPresetOver }, presetDrop] = useDrop(() => ({
        accept: [ItemTypes.PRESET, ItemTypes.ASSET],
        drop: (item: PresetDropItem | DropItem, monitor) => {
            if (monitor.didDrop()) return;
            if ('preset' in item) {
                onLoadPreset(item.preset);
            } else {
                onDropAssetToFirstSlot(item);
            }
        },
        collect: (monitor) => ({
            isPresetOver: !!monitor.isOver(),
        }),
    }), [onLoadPreset, onDropAssetToFirstSlot]);

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
        <div
            ref={(node) => {
                presetDrop(node);
                (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }}
            className="flex h-full w-full items-center justify-center"
        >
            <div
                className={clsx(
                    'relative flex items-center justify-center rounded-lg border-4 p-2 transition-colors duration-300',
                    isPresetOver && 'ring-4 ring-paladin-gold/60',
                    battlePreview && 'border-arcane-purple border-solid',
                    !battlePreview && status === 'empty' && 'border-faded-ink/40 border-dashed',
                    !battlePreview && status === 'staged' && !isSaving && 'border-arcane-purple border-solid',
                    !battlePreview && status === 'live' && !isSaving && 'border-paladin-gold border-solid',
                    !battlePreview && isSaving && 'border-paladin-gold border-solid',
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

                {/* Main content: battle preview or image slots */}
                {battlePreview ? (
                    <div className="relative z-[1] flex h-full w-full flex-col items-center justify-center">
                        <div className="mb-2 rounded-full border border-arcane-purple/40 bg-arcane-purple/10 px-3 py-0.5 text-xs font-semibold text-arcane-purple">
                            Battle is Live
                        </div>
                        <div className="h-full w-full overflow-hidden" style={{ transform: 'scale(0.55)', transformOrigin: 'top center' }}>
                            <PlayerBattleView battleState={battlePreview} />
                        </div>
                    </div>
                ) : (
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
                )}
            </div>
        </div>
    );
}
