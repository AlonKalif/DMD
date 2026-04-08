// /src/components/screen-mirroring/AssetPanel.tsx
import { MediaAsset, PresetLayout } from 'types/api';
import { API_BASE_URL } from 'config';
import { useDrag } from 'react-dnd';
import { useEffect, useState, useRef, useCallback } from 'react';
import { EditAssetModal } from 'components/screen-mirroring/EditAssetModal';
import { PresetPanel } from 'components/screen-mirroring/PresetPanel';
import { isPdfUrl } from 'components/screen-mirroring/ImageSlot';
import { Document, Page } from 'react-pdf';
import axios from 'axios';
import clsx from 'clsx';

export const ItemTypes = {
    ASSET: 'asset',
    SLOT: 'slot',
};

interface DraggableAssetProps {
    asset: MediaAsset;
    onEdit: (asset: MediaAsset) => void;
    onDelete: (asset: MediaAsset) => void;
}

function DraggableAsset({ asset, onEdit, onDelete }: DraggableAssetProps) {
    const assetUrl = `${API_BASE_URL}/static/${asset.file_path.replace(/^public\//, '')}`;
    const isPdf = isPdfUrl(assetUrl);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.ASSET,
        item: { id: asset.ID, url: assetUrl },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const displayType = asset.type === 'unknown' ? '' : asset.type;

    return (
        <button
            ref={drag}
            className="group relative flex-shrink-0"
            style={{ opacity: isDragging ? 0.5 : 1 }}
        >
            {isPdf ? (
                <div className="relative h-28 w-28 overflow-hidden rounded-md ring-2 ring-transparent group-hover:ring-arcane-purple">
                    <Document
                        file={assetUrl}
                        loading={<div className="flex h-28 w-28 items-center justify-center bg-leather-dark text-faded-ink text-xs">PDF</div>}
                        error={<div className="flex h-28 w-28 items-center justify-center bg-leather-dark text-red-400 text-xs">Error</div>}
                    >
                        <Page pageNumber={1} width={112} renderTextLayer={false} renderAnnotationLayer={false} />
                    </Document>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <span className="px-1 text-center text-xs font-semibold text-white drop-shadow-lg line-clamp-3">
                            {asset.name}.pdf
                        </span>
                    </div>
                </div>
            ) : (
                <img
                    src={assetUrl}
                    alt={asset.name}
                    className="h-28 w-28 rounded-md object-cover ring-2 ring-transparent group-hover:ring-arcane-purple"
                />
            )}
            <div
                onClick={() => onDelete(asset)}
                className="absolute top-1 left-1 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/50 text-parchment opacity-0 transition-opacity group-hover:opacity-100 hover:bg-wax-red"
                title="Delete asset"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <div
                onClick={() => onEdit(asset)}
                className="absolute top-1 right-1 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/50 text-parchment opacity-0 transition-opacity group-hover:opacity-100 hover:bg-arcane-purple"
                title="Edit Type"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 15h2m4 0h.01M17 3l-4.5 4.5" />
                </svg>
            </div>
            {!isPdf && displayType && (
                <div
                    className={clsx(
                        "absolute bottom-1 left-1 z-10 rounded-full px-2 py-0.5 text-xs font-semibold text-white",
                        "bg-black/70 opacity-0 transition-opacity duration-200",
                        "group-hover:opacity-100",
                        displayType === 'Uncategorized' ? 'bg-faded-ink' : 'bg-paladin-gold text-ink'
                    )}
                >
                    {displayType}
                </div>
            )}
        </button>
    );
}

interface FilterPillsProps {
    activeType: string;
    onTypeSelect: (type: string) => void;
    refreshKey: number;
}

function FilterPills({ activeType, onTypeSelect, refreshKey }: FilterPillsProps) {
    const [types, setTypes] = useState<string[]>([]);

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const response = await axios.get<string[]>(`${API_BASE_URL}/api/v1/images/types`);
                setTypes(['All', ...response.data]);
            } catch (error) {
                console.error("Failed to fetch image types:", error);
                setTypes(['All']);
            }
        };
        fetchTypes();
    }, [refreshKey]);

    return (
        <div className="flex flex-shrink-0 flex-col items-start gap-1 overflow-y-auto pr-2 max-h-28 no-scrollbar">
            {types.map(type => (
                <button
                    key={type}
                    onClick={() => onTypeSelect(type)}
                    className={clsx(
                        "flex-shrink-0 whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-semibold text-parchment transition-colors",
                        activeType === type ? 'bg-paladin-gold text-ink' : 'bg-faded-ink/30 hover:bg-faded-ink/50'
                    )}
                >
                    {type}
                </button>
            ))}
        </div>
    );
}

function ScrollableAssetStrip({ assets, onEditAsset, onDeleteAsset }: {
    assets: MediaAsset[];
    onEditAsset: (asset: MediaAsset) => void;
    onDeleteAsset: (asset: MediaAsset) => void;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        checkScroll();
        el.addEventListener('scroll', checkScroll);
        const observer = new ResizeObserver(checkScroll);
        observer.observe(el);
        return () => {
            el.removeEventListener('scroll', checkScroll);
            observer.disconnect();
        };
    }, [checkScroll, assets]);

    const scroll = (direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        const amount = 240;
        el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    // Wheel-to-horizontal-scroll
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            if (e.deltaY === 0) return;
            e.preventDefault();
            el.scrollBy({ left: e.deltaY, behavior: 'auto' });
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    return (
        <div className="group/scroll relative flex-1 min-w-0">
            {/* Left arrow */}
            {canScrollLeft && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-0 bottom-0 z-10 flex w-8 items-center justify-center bg-gradient-to-r from-leather-dark/90 to-transparent opacity-0 transition-opacity group-hover/scroll:opacity-100"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-parchment" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            )}

            {/* Scrollable strip — no visible scrollbar */}
            <div
                ref={scrollRef}
                className="flex items-center space-x-2 overflow-x-auto py-0.5 px-0.5 no-scrollbar"
            >
                {assets.map((asset) => (
                    <DraggableAsset
                        key={asset.ID}
                        asset={asset}
                        onEdit={onEditAsset}
                        onDelete={onDeleteAsset}
                    />
                ))}
                {assets.length === 0 && (
                    <div className="flex h-28 items-center justify-center">
                        <p className="text-faded-ink text-sm">No assets found.</p>
                    </div>
                )}
            </div>

            {/* Right arrow */}
            {canScrollRight && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-0 bottom-0 z-10 flex w-8 items-center justify-center bg-gradient-to-l from-leather-dark/90 to-transparent opacity-0 transition-opacity group-hover/scroll:opacity-100"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-parchment" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}
        </div>
    );
}

interface AssetPanelProps {
    isExpanded: boolean;
    activeTab: 'assets' | 'presets';
    onBrowseClick: () => void;
    onLoadPreset: (preset: PresetLayout) => void;
    onDeletePreset: (id: number) => void;
    presetRefreshKey: number;
    assetRefreshKey: number;
}

export function AssetPanel({ isExpanded, activeTab, onBrowseClick, onLoadPreset, onDeletePreset, presetRefreshKey, assetRefreshKey }: AssetPanelProps) {
    const [activeType, setActiveType] = useState('All');
    const [assets, setAssets] = useState<MediaAsset[]>([]);

    const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleSaveAsset = async (updatedAsset: MediaAsset) => {
        try {
            await axios.put(`${API_BASE_URL}/api/v1/images/images/${updatedAsset.ID}`, updatedAsset);
            setEditingAsset(null);
            setRefreshKey(key => key + 1);
        } catch (error) {
            console.error("Failed to save asset:", error);
        }
    };

    const handleDeleteAsset = async (asset: MediaAsset) => {
        setAssets(prev => prev.filter(a => a.ID !== asset.ID));
        try {
            await axios.delete(`${API_BASE_URL}/api/v1/images/images/${asset.ID}`);
            setRefreshKey(key => key + 1);
        } catch (error) {
            console.error("Failed to delete asset:", error);
            setRefreshKey(key => key + 1);
        }
    };

    useEffect(() => {
        const fetchAssets = async () => {
            let url = `${API_BASE_URL}/api/v1/images/images`;
            if (activeType !== 'All') {
                url += `?type=${activeType}`;
            }

            try {
                const response = await axios.get<MediaAsset[]>(url);
                setAssets(response.data);
            } catch (error) {
                console.error(`Failed to fetch assets for type ${activeType}:`, error);
                setAssets([]);
            }
        };

        fetchAssets();
    }, [activeType, refreshKey, assetRefreshKey]);

    if (!isExpanded) return null;

    return (
        <div className="leather-card border-y border-paladin-gold/20 px-2 py-1.5">
            {activeTab === 'assets' ? (
                <>
                    <div className="flex items-center gap-2">
                        {/* Filter pills — vertical scrollable on the left */}
                        <FilterPills activeType={activeType} onTypeSelect={setActiveType} refreshKey={refreshKey} />

                        {/* Divider */}
                        <div className="h-24 w-px flex-shrink-0 bg-paladin-gold/20" />

                        {/* Scrollable image strip with hover arrows */}
                        <ScrollableAssetStrip
                            assets={assets}
                            onEditAsset={setEditingAsset}
                            onDeleteAsset={handleDeleteAsset}
                        />

                        {/* Browse button on the right */}
                        <div className="flex-shrink-0 pl-1">
                            <button
                                onClick={onBrowseClick}
                                className="flex h-28 w-20 flex-col items-center justify-center rounded-md border-2 border-dashed border-paladin-gold/30 text-faded-ink transition-colors hover:border-arcane-purple hover:text-arcane-purple"
                                title="Browse for a local file"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="mt-0.5 text-xs font-semibold">Browse</span>
                            </button>
                        </div>
                    </div>
                    {editingAsset && (
                        <EditAssetModal
                            asset={editingAsset}
                            onClose={() => setEditingAsset(null)}
                            onSave={handleSaveAsset}
                        />
                    )}
                </>
            ) : (
                <PresetPanel
                    onLoadPreset={onLoadPreset}
                    onDeletePreset={onDeletePreset}
                    refreshKey={presetRefreshKey}
                />
            )}
        </div>
    );
}
