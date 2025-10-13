// File: /src/components/screen-mirroring/AssetSelectionBar.tsx
import { MediaAsset } from 'types/api';
import { API_BASE_URL } from 'config';

interface AssetSelectionBarProps {
    assets: MediaAsset[];
    onAssetSelect: (asset: MediaAsset) => void;
    onBrowseClick: () => void;
}

export function AssetSelectionBar({ assets, onAssetSelect, onBrowseClick }: AssetSelectionBarProps) {
    return (
        <div className="flex flex-shrink-0 items-center space-x-2 overflow-x-auto border-y border-gray-700 bg-gray-800 p-2">
            {/* Render existing assets */}
            {assets.map((asset) => (
                <button key={asset.ID} onClick={() => onAssetSelect(asset)} className="group flex-shrink-0">
                    <img
                        src={`${API_BASE_URL}/static/${asset.file_path.replace(/^public\//, '')}`}
                        alt={asset.file_path}
                        className="h-28 w-28 rounded-md object-cover ring-2 ring-transparent group-hover:ring-blue-500"
                    />
                </button>
            ))}

            {/* If no assets, show a placeholder message */}
            {assets.length === 0 && (
                <div className="flex h-28 items-center justify-center">
                    <p className="text-gray-400">No media assets found.</p>
                </div>
            )}

            {/* Browse Button pushed to the right */}
            <div className="ml-auto flex-shrink-0 pl-2">
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