import { useEffect, useState, useRef, useCallback } from 'react';
import { MediaAsset } from 'types/api';
import { API_BASE_URL } from 'config';
import { DraggableAsset, FilterPills } from './AssetPanel';
import { EditAssetModal } from './EditAssetModal';
import axios from 'axios';

interface LeftSidebarProps {
    onBrowseClick: () => void;
    onClickAsset: (item: { id: number; url: string }) => void;
    assetRefreshKey: number;
}

export function LeftSidebar({ onBrowseClick, onClickAsset, assetRefreshKey }: LeftSidebarProps) {
    const [activeType, setActiveType] = useState('All');
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);

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

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollUp(el.scrollTop > 0);
        setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
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

    const scroll = (direction: 'up' | 'down') => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ top: direction === 'up' ? -240 : 240, behavior: 'smooth' });
    };

    return (
        <div className="flex h-full w-[136px] flex-shrink-0 flex-col border-r border-paladin-gold/20 leather-card">
            {/* Filter pills */}
            <div className="flex-shrink-0 border-b border-paladin-gold/20 px-2 py-2">
                <FilterPills activeType={activeType} onTypeSelect={setActiveType} refreshKey={refreshKey} />
            </div>

            {/* Vertical asset scroll with hover arrows */}
            <div className="group/scroll relative flex-1 min-h-0">
                {canScrollUp && (
                    <button
                        onClick={() => scroll('up')}
                        className="absolute top-0 left-0 right-0 z-10 flex h-8 items-center justify-center bg-gradient-to-b from-leather-dark/90 to-transparent opacity-0 transition-opacity group-hover/scroll:opacity-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-parchment" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                )}

                <div
                    ref={scrollRef}
                    className="flex h-full flex-col items-center gap-2 overflow-y-auto p-2 no-scrollbar"
                >
                    {assets.map((asset) => (
                        <DraggableAsset
                            key={asset.ID}
                            asset={asset}
                            onEdit={setEditingAsset}
                            onDelete={handleDeleteAsset}
                            onClick={onClickAsset}
                        />
                    ))}
                    {assets.length === 0 && (
                        <div className="flex flex-1 items-center justify-center">
                            <p className="text-faded-ink text-xs text-center">No assets found.</p>
                        </div>
                    )}
                </div>

                {canScrollDown && (
                    <button
                        onClick={() => scroll('down')}
                        className="absolute bottom-0 left-0 right-0 z-10 flex h-8 items-center justify-center bg-gradient-to-t from-leather-dark/90 to-transparent opacity-0 transition-opacity group-hover/scroll:opacity-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-parchment" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Browse button */}
            <div className="flex-shrink-0 border-t border-paladin-gold/20 p-2">
                <button
                    onClick={onBrowseClick}
                    className="flex w-full items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-paladin-gold/30 py-2 text-faded-ink transition-colors hover:border-arcane-purple hover:text-arcane-purple"
                    title="Browse for a local file"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs font-semibold">Browse</span>
                </button>
            </div>

            {editingAsset && (
                <EditAssetModal
                    asset={editingAsset}
                    onClose={() => setEditingAsset(null)}
                    onSave={handleSaveAsset}
                />
            )}
        </div>
    );
}
