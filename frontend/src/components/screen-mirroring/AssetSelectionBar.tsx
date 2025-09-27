// File: /src/components/screen-mirroring/AssetSelectionBar.tsx
// This defines the shape of our MediaAsset object from the backend
import { MediaAsset } from 'types/api';

interface AssetSelectionBarProps {
    assets: MediaAsset[];
    onAssetSelect: (asset: MediaAsset) => void;
}

const API_BASE_URL = 'http://localhost:8080';

export function AssetSelectionBar({ assets, onAssetSelect }: AssetSelectionBarProps) {
    if (assets.length === 0) {
        return (
            <div className="flex h-32 items-center justify-center border-y border-gray-700 bg-gray-800">
                <p className="text-gray-400">No media assets found. Add some via the API!</p>
            </div>
        );
    }

    return (
        <div className="flex space-x-2 overflow-x-auto border-y border-gray-700 bg-gray-800 p-2">
            {assets.map((asset) => (
                <button key={asset.ID} onClick={() => onAssetSelect(asset)} className="group flex-shrink-0">
                    <img
                        src={`${API_BASE_URL}/static/${asset.file_path}`}
                        alt={asset.name}
                        className="h-28 w-28 rounded-md object-cover ring-2 ring-transparent group-hover:ring-blue-500"
                    />
                </button>
            ))}
        </div>
    );
}