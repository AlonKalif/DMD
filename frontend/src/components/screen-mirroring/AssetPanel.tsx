// /src/components/screen-mirroring/AssetSelectionBar.tsx
import { MediaAsset } from 'types/api';
import { API_BASE_URL } from 'config';
import { useDrag } from 'react-dnd';
import { useHorizontalScroll } from 'hooks/useHorizontalScroll';

export const ItemTypes = {
    ASSET: 'asset',
    SLOT: 'slot',
};

function DraggableAsset({ asset }: { asset: MediaAsset }) {
    const assetUrl = `${API_BASE_URL}/static/${asset.file_path.replace(/^public\//, '')}`;

    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.ASSET,
        item: { id: asset.ID, url: assetUrl },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <button
            ref={drag}
            className="group flex-shrink-0"
            style={{ opacity: isDragging ? 0.5 : 1 }}
        >
            <img
                src={assetUrl}
                alt={asset.file_path}
                className="h-28 w-28 rounded-md object-cover ring-2 ring-transparent group-hover:ring-blue-500"
            />
        </button>
    );
}

export function FilterPills() {
    const types = ['All', 'Maps', 'Characters', 'Items', 'Monsters'];
    const scrollRef = useHorizontalScroll();

    return (
        <div
            ref={scrollRef}
            className="scrollbar-hide flex items-center space-x-2 overflow-x-auto"
        >
            {types.map(type => (
                <button
                    key={type}
                    className="flex-shrink-0 rounded-full bg-gray-700 px-4 py-0.1 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
                >
                    {type}
                </button>
            ))}
        </div>
    );
}

export function AssetSelectionBar({ assets, onBrowseClick }: { assets: MediaAsset[], onBrowseClick: () => void }) {
    const scrollRef = useHorizontalScroll();

    return (
        <div className="flex flex-shrink-0 items-center">

            {/* Images Array */}
            <div
                ref={scrollRef}
                className="flex flex-grow items-center space-x-2 overflow-x-auto py-0.5 px-0.5 scrollbar-hide scrollbar-track-gray-700 scrollbar-thumb-gray-500 hover:scrollbar-thumb-blue-500"
            >
                {assets.map((asset) => (
                    <DraggableAsset key={asset.ID} asset={asset} />
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

export function AssetPanel({ assets, onBrowseClick }: { assets: MediaAsset[], onBrowseClick: () => void }) {
    return (
        <div className="space-y-2 border-y border-gray-700 bg-gray-800 p-2">
            <AssetSelectionBar assets={assets} onBrowseClick={onBrowseClick} />
            <FilterPills />
        </div>
    );
}