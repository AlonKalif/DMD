// /src/components/screen-mirroring/AssetPanel.tsx
// Shared sub-components used by LeftSidebar
import { MediaAsset } from 'types/api';
import { API_BASE_URL } from 'config';
import { useDrag } from 'react-dnd';
import { useEffect, useState } from 'react';
import { isPdfUrl } from 'components/screen-mirroring/ImageSlot';
import { Document, Page } from 'react-pdf';
import axios from 'axios';
import clsx from 'clsx';

export const ItemTypes = {
    ASSET: 'asset',
    SLOT: 'slot',
    PRESET: 'preset',
};

interface DraggableAssetProps {
    asset: MediaAsset;
    onEdit: (asset: MediaAsset) => void;
    onDelete: (asset: MediaAsset) => void;
    onClick?: (item: { id: number; url: string }) => void;
}

export function DraggableAsset({ asset, onEdit, onDelete, onClick }: DraggableAssetProps) {
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

    const handleClick = () => {
        if (onClick) onClick({ id: asset.ID, url: assetUrl });
    };

    return (
        <button
            ref={drag}
            onClick={handleClick}
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

export function FilterPills({ activeType, onTypeSelect, refreshKey }: FilterPillsProps) {
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
        <div className="flex flex-shrink-0 flex-wrap items-start gap-1 no-scrollbar">
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
