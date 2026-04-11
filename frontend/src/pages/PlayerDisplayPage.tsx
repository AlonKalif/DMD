// /src/pages/PlayerDisplayPage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Document, Page } from 'react-pdf';
import { BroadcastMessage } from '../hooks/useBroadcastChannel';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setCurrentLayout, clearLayout, setBattleState, clearBattle } from 'features/display/displaySlice';
import { DEFAULT_PLAYER_WINDOW_IMG } from 'config';
import { LayoutState } from './ScreenMirroringPage';
import { BattleDisplayPayload } from 'types/api';
import { isPdfUrl } from 'components/screen-mirroring/ImageSlot';
import { PlayerBattleView } from 'components/crawl/PlayerBattleView';

function PlayerPdfSlot({ url, zoom, page, positionY }: { url: string; zoom: number; page: number; positionY: number }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pdfPageSize, setPdfPageSize] = useState<{ width: number; height: number } | null>(null);
    const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            setContainerSize({ width, height });
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const onDocumentLoadSuccess = useCallback(async (pdf: any) => {
        const p = await pdf.getPage(page || 1);
        const viewport = p.getViewport({ scale: 1 });
        setPdfPageSize({ width: viewport.width, height: viewport.height });
    }, [page]);

    const pdfScale = (() => {
        if (!pdfPageSize || !containerSize) return zoom;
        const scaleX = containerSize.width / pdfPageSize.width;
        const scaleY = containerSize.height / pdfPageSize.height;
        const baseScale = Math.min(scaleX, scaleY);
        return baseScale * zoom;
    })();

    return (
        <div
            ref={containerRef}
            className="flex h-full w-full items-center justify-center overflow-hidden"
            style={{ transform: `translateY(${positionY || 0}%)` }}
        >
            <Document
                file={url}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="text-gray-400 text-sm">Loading PDF...</div>}
                error={<div className="text-red-400 text-sm">Failed to load PDF</div>}
            >
                <Page
                    pageNumber={page || 1}
                    scale={pdfScale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                />
            </Document>
        </div>
    );
}

export default function PlayerDisplayPage() {
    const dispatch = useAppDispatch();
    const displayMode = useAppSelector((state) => state.display.displayMode);
    const currentLayout = useAppSelector((state) => state.display.currentLayout);
    const battleState = useAppSelector((state) => state.display.battleState);

    const channel = useMemo(() => new BroadcastChannel('dmd-channel'), []);

    const broadcastContentChanged = useCallback((contentType: 'layout' | 'battle' | 'idle') => {
        channel.postMessage({ type: 'player_content_changed', payload: { contentType } });
    }, [channel]);

    const handleBroadcastMessage = useCallback((message: BroadcastMessage) => {
        if (message.type === 'show_layout') {
            dispatch(setCurrentLayout(message.payload as LayoutState));
            broadcastContentChanged('layout');
        }
        if (message.type === 'clear_layout') {
            dispatch(clearLayout());
            broadcastContentChanged('idle');
        }
        if (message.type === 'show_battle') {
            dispatch(setBattleState(message.payload as BattleDisplayPayload));
            broadcastContentChanged('battle');
        }
        if (message.type === 'clear_battle') {
            dispatch(clearBattle());
            broadcastContentChanged('idle');
        }
        if (message.type === 'request_current_content') {
            if (displayMode === 'battle' && battleState) {
                channel.postMessage({ type: 'response_is_battle', payload: battleState });
            } else if (displayMode === 'layout' && currentLayout) {
                channel.postMessage({ type: 'response_current_content', payload: currentLayout });
            } else {
                channel.postMessage({ type: 'response_is_empty' });
            }
        }
    }, [dispatch, displayMode, currentLayout, battleState, channel, broadcastContentChanged]);

    useEffect(() => {
        const handler = (event: MessageEvent<BroadcastMessage>) => {
            handleBroadcastMessage(event.data);
        };
        channel.onmessage = handler;
        return () => { channel.onmessage = null; };
    }, [channel, handleBroadcastMessage]);

    const gridClasses = {
        single: 'grid-cols-1 grid-rows-1',
        dual: 'grid-cols-2 grid-rows-1',
        quad: 'grid-cols-2 grid-rows-2',
    };

    return (
        <div id="player-root-container" className="flex h-screen w-screen items-center justify-center overflow-hidden bg-black p-4">
            {displayMode === 'battle' && battleState ? (
                <div className="relative h-full w-full">
                    <img
                        src={DEFAULT_PLAYER_WINDOW_IMG}
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 m-auto max-h-full max-w-full rounded-lg object-cover opacity-30 select-none"
                    />
                    <div className="relative z-10 h-full w-full">
                        <PlayerBattleView battleState={battleState} />
                    </div>
                </div>
            ) : displayMode === 'layout' && currentLayout ? (
                <div className={clsx('grid h-full w-full gap-2', gridClasses[currentLayout.layout])}>
                    {currentLayout.slots.map(({ slotId, url, zoom, page, positionY }) => (
                        <div key={slotId} className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-gray-900">
                            {url ? (
                                isPdfUrl(url) ? (
                                    <PlayerPdfSlot url={url} zoom={zoom} page={page || 1} positionY={positionY || 0} />
                                ) : (
                                    <img
                                        src={url}
                                        alt={`Content for slot ${slotId + 1}`}
                                        className="h-full w-full object-contain transition-transform duration-200"
                                        style={{ transform: `scale(${zoom}) translateY(${positionY || 0}%)` }}
                                    />
                                )
                            ) : null}
                        </div>
                    ))}
                </div>
            ) : (
                <img
                    src={DEFAULT_PLAYER_WINDOW_IMG}
                    alt="Player display waiting for content"
                    className="max-h-full max-w-full rounded-lg object-cover"
                />
            )}
        </div>
    );
}
