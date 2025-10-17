// /src/components/screen-mirroring/AssetPanel.tsx
import { MediaAsset } from 'types/api';
import { API_BASE_URL } from 'config';
import { useDrag } from 'react-dnd';
import { useEffect, useState } from 'react';
import { useHorizontalScroll } from 'hooks/useHorizontalScroll';
import { EditAssetModal } from 'components/screen-mirroring/EditAssetModal';
import axios from 'axios';
import clsx from 'clsx';

export const ItemTypes = {
    ASSET: 'asset',
    SLOT: 'slot',
};

interface DraggableAssetProps {
    asset: MediaAsset;
    onEdit: (asset: MediaAsset) => void;
}

function DraggableAsset({ asset, onEdit }: DraggableAssetProps) {
    const assetUrl = `${API_BASE_URL}/static/${asset.file_path.replace(/^public\//, '')}`;

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
            <img
                src={assetUrl}
                alt={asset.name}
                className="h-28 w-28 rounded-md object-cover ring-2 ring-transparent group-hover:ring-blue-500"
            />
            {/* Edit Button */}
            <div
                onClick={() => onEdit(asset)}
                className="absolute top-1 right-1 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-blue-600"
                title="Edit Type"
            >
                {/* Simple "tag" SVG icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 15h2m4 0h.01M17 3l-4.5 4.5" />
                </svg>
            </div>
            {/* --- START: NEW TYPE DISPLAY --- */}
            {displayType && ( // Only show if there's a type to display
                <div
                    // Position at bottom-left, hide by default, show on hover
                    className={clsx(
                        "absolute bottom-1 left-1 z-10 rounded-full px-2 py-0.5 text-xs font-semibold text-white",
                        "bg-black/70 opacity-0 transition-opacity duration-200",
                        "group-hover:opacity-100",
                        // Optional: Different color for 'Uncategorized'
                        displayType === 'Uncategorized' ? 'bg-gray-500' : 'bg-green-600'
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
                        "flex-shrink-0 rounded-full px-4 py-1 text-sm font-semibold text-white transition-colors",
                        activeType === type ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
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
}

export function AssetSelectionBar({ assets, onBrowseClick, onEditAsset }: AssetSelectionBarProps) {
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
                    />
                ))}

                {assets.length === 0 && (
                    <div className="flex h-28 items-center justify-center">
                        <p className="text-gray-400">No media assets found.</p>
                    </div>
                )}
            </div>

            {/* Browse Button */}
            <div className="flex-shrink-0 pl-2">
                <button
                    onClick={onBrowseClick}
                    className="flex h-28 w-28 flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-600 text-gray-400 transition-colors hover:border-blue-500 hover:text-blue-500"
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

export function AssetPanel({ onBrowseClick }: { onBrowseClick: () => void }) {
    const [activeType, setActiveType] = useState('All');
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    // const [isLoading, setIsLoading] = useState(false);

    const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
    const [refreshKey, setRefreshKey] = useState(0); // Used to trigger a data refresh

    const handleSaveAsset = async (updatedAsset: MediaAsset) => {
        try {
            await axios.put(`${API_BASE_URL}/api/v1/images/images/${updatedAsset.ID}`, updatedAsset);
            setEditingAsset(null); // Close the modal
            setRefreshKey(key => key + 1); // Trigger a refresh of assets and types
        } catch (error) {
            console.error("Failed to save asset:", error);
            // Here you could add user-facing error handling
        }
    };

    useEffect(() => {
        const fetchAssets = async () => {
            // setIsLoading(true);
            let url = `${API_BASE_URL}/api/v1/images/images`;
            // If the filter is not "All", add the query parameter
            if (activeType !== 'All') {
                url += `?type=${activeType}`;
            }

            try {
                const response = await axios.get<MediaAsset[]>(url);
                setAssets(response.data);
            } catch (error) {
                console.error(`Failed to fetch assets for type ${activeType}:`, error);
                setAssets([]); // Clear assets on error
            }
            // finally {
            //     setIsLoading(false);
            // }
        };

        fetchAssets();
    }, [activeType, refreshKey]); // Re-run this effect whenever the activeType changes

    return (
        <div className="space-y-2 border-y border-gray-700 bg-gray-800 p-2">
            <AssetSelectionBar
                assets={assets}
                onBrowseClick={onBrowseClick}
                onEditAsset={setEditingAsset} // Pass the handler to open the modal
            />
            {/* --- Conditionally render the modal --- */}
            {editingAsset && (
                <EditAssetModal
                    asset={editingAsset}
                    onClose={() => setEditingAsset(null)}
                    onSave={handleSaveAsset}
                />
            )}
            {/* We can add a loading indicator here later if we want */}
            <FilterPills activeType={activeType} onTypeSelect={setActiveType} refreshKey={refreshKey} />
        </div>
    );
}