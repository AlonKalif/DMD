// /src/components/screen-mirroring/AssetPanel.tsx
import { MediaAsset, PresetLayout } from 'types/api';
import { API_BASE_URL } from 'config';
import { useDrag } from 'react-dnd';
import { useEffect, useState } from 'react';
import { useHorizontalScroll } from 'hooks/useHorizontalScroll';
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
                    {/* Darkened overlay with filename on hover */}
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
            {/* Delete Button */}
            <div
                onClick={() => onDelete(asset)}
                className="absolute top-1 left-1 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/50 text-parchment opacity-0 transition-opacity group-hover:opacity-100 hover:bg-wax-red"
                title="Delete asset"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            {/* Edit Button */}
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
    refreshKey: number
}

function FilterPills({ activeType, onTypeSelect, refreshKey }: FilterPillsProps) {
    const [types, setTypes] = useState<string[]>([]);
    const scrollRef = useHorizontalScroll();

    useEffect(() => {
        // Fetch the list of types from the backend when the component mounts
        const fetchTypes = async () => {
            try {
                const response = await axios.get<string[]>(`${API_BASE_URL}/api/v1/images/types`);
                // Add "All" to the beginning of the list
                setTypes(['All', ...response.data]);
            } catch (error) {
                console.error("Failed to fetch image types:", error);
                setTypes(['All']); // Fallback
            }
        };
        fetchTypes();
    }, [refreshKey]); // Empty array ensures this runs only once

    return (
        <div ref={scrollRef} className="scrollbar-hide flex items-center space-x-2 overflow-x-auto pb-2">
            {types.map(type => (
                <button
                    key={type}
                    onClick={() => onTypeSelect(type)}
                    className={clsx(
                        "flex-shrink-0 rounded-full px-4 py-1 text-sm font-semibold text-parchment transition-colors",
                        activeType === type ? 'bg-paladin-gold text-ink' : 'bg-faded-ink/30 hover:bg-faded-ink/50'
                    )}
                >
                    {type}
                </button>
            ))}
        </div>
    );
}

interface AssetSelectionBarProps {
    assets: MediaAsset[];
    onBrowseClick: () => void;
    onEditAsset: (asset: MediaAsset) => void;
    onDeleteAsset: (asset: MediaAsset) => void;
}

export function AssetSelectionBar({ assets, onBrowseClick, onEditAsset, onDeleteAsset }: AssetSelectionBarProps) {
    const scrollRef = useHorizontalScroll();

    return (
        <div className="flex flex-shrink-0 items-center">

            {/* Images Array */}
            <div
                ref={scrollRef}
                className="flex flex-grow items-center space-x-2 overflow-x-auto py-0.5 px-0.5 scrollbar-hide scrollbar-track-gray-700 scrollbar-thumb-gray-500 hover:scrollbar-thumb-blue-500"
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
                        <p className="text-faded-ink">No media assets found.</p>
                    </div>
                )}
            </div>

            {/* Browse Button */}
            <div className="flex-shrink-0 pl-2">
                <button
                    onClick={onBrowseClick}
                    className="flex h-28 w-28 flex-col items-center justify-center rounded-md border-2 border-dashed border-paladin-gold/30 text-faded-ink transition-colors hover:border-arcane-purple hover:text-arcane-purple"
                    title="Browse for a local file"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="mt-1 text-sm font-semibold">Browse</span>
                </button>
            </div>
        </div>
    );
}

interface AssetPanelProps {
    onBrowseClick: () => void;
    onLoadPreset: (preset: PresetLayout) => void;
    onDeletePreset: (id: number) => void;
    presetRefreshKey: number;
    assetRefreshKey: number;
}

export function AssetPanel({ onBrowseClick, onLoadPreset, onDeletePreset, presetRefreshKey, assetRefreshKey }: AssetPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'assets' | 'presets'>('assets');
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

    return (
        <div className="leather-card border-y border-paladin-gold/20">
            {/* Collapsed bar: always visible */}
            <div className="flex items-center gap-2 px-2 py-1">
                <button
                    onClick={() => setIsExpanded(prev => !prev)}
                    className="flex items-center gap-1.5 rounded-full bg-faded-ink/30 px-3 py-0.5 text-xs font-semibold text-parchment transition-colors hover:bg-faded-ink/50"
                    title={isExpanded ? 'Collapse asset panel' : 'Expand asset panel'}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={clsx("h-3.5 w-3.5 transition-transform duration-200", isExpanded && "rotate-180")}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                    {isExpanded ? 'Collapse' : 'Assets & Presets'}
                </button>

                {/* Tab pills in the collapsed bar */}
                {isExpanded && (
                    <>
                        <button
                            onClick={() => setActiveTab('assets')}
                            className={clsx(
                                "flex-shrink-0 rounded-full px-3 py-0.5 text-xs font-semibold text-parchment transition-colors",
                                activeTab === 'assets' ? 'bg-arcane-purple' : 'bg-faded-ink/30 hover:bg-faded-ink/50'
                            )}
                        >
                            Assets
                        </button>
                        <button
                            onClick={() => setActiveTab('presets')}
                            className={clsx(
                                "flex-shrink-0 rounded-full px-3 py-0.5 text-xs font-semibold text-parchment transition-colors",
                                activeTab === 'presets' ? 'bg-arcane-purple' : 'bg-faded-ink/30 hover:bg-faded-ink/50'
                            )}
                        >
                            Presets
                        </button>
                    </>
                )}
            </div>

            {/* Expanded content */}
            {isExpanded && (
                <div className="space-y-2 px-2 pb-2">
                    {activeTab === 'assets' ? (
                        <>
                            <AssetSelectionBar
                                assets={assets}
                                onBrowseClick={onBrowseClick}
                                onEditAsset={setEditingAsset}
                                onDeleteAsset={handleDeleteAsset}
                            />
                            {editingAsset && (
                                <EditAssetModal
                                    asset={editingAsset}
                                    onClose={() => setEditingAsset(null)}
                                    onSave={handleSaveAsset}
                                />
                            )}
                            <FilterPills activeType={activeType} onTypeSelect={setActiveType} refreshKey={refreshKey} />
                        </>
                    ) : (
                        <PresetPanel
                            onLoadPreset={onLoadPreset}
                            onDeletePreset={onDeletePreset}
                            refreshKey={presetRefreshKey}
                        />
                    )}
                </div>
            )}
        </div>
    );
}