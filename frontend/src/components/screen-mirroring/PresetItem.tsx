// /src/components/screen-mirroring/PresetItem.tsx
import { PresetLayout } from 'types/api';
import { API_BASE_URL } from 'config';
import { isPdfUrl } from 'components/screen-mirroring/ImageSlot';
import { Document, Page } from 'react-pdf';
import clsx from 'clsx';

interface PresetItemProps {
    preset: PresetLayout;
    onLoad: (preset: PresetLayout) => void;
    onDelete: (id: number) => void;
}

export function PresetItem({ preset, onLoad, onDelete }: PresetItemProps) {
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering onLoad
        onDelete(preset.ID);
    };

    // Grid classes based on layout type
    const gridClasses = {
        single: 'grid-cols-1 grid-rows-1',
        dual: 'grid-cols-2 grid-rows-1',
        quad: 'grid-cols-2 grid-rows-2',
    };

    // Safety check for slots
    const slots = preset.slots || [];

    return (
        <div className="group relative flex h-32 w-32 flex-shrink-0">
            {/* Delete button - positioned outside the main container */}
            <button
                onClick={handleDelete}
                className="absolute -top-2 -right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-leather-dark text-parchment opacity-0 transition-all hover:bg-wax-red group-hover:opacity-100"
                title="Delete preset"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            
            {/* Main preset container */}
            <div
                onClick={() => onLoad(preset)}
                className="flex h-full w-full cursor-pointer rounded-md border-2 border-paladin-gold/30 bg-obsidian p-1 transition-all hover:border-arcane-purple hover:shadow-lg arcane-glow-hover"
            >

                {/* Mini preview grid */}
                <div className={clsx('grid h-full w-full gap-0.5', gridClasses[preset.layout_type])}>
                    {slots.map((slot) => {
                        const assetUrl = `${API_BASE_URL}/static/${slot.image.file_path.replace(/^public\//, '')}`;
                        const isPdf = isPdfUrl(assetUrl);
                        return (
                            <div
                                key={slot.ID}
                                className="relative overflow-hidden rounded-sm bg-leather-dark"
                            >
                                {isPdf ? (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <Document
                                            file={assetUrl}
                                            loading={<div className="text-faded-ink text-[8px]">PDF</div>}
                                            error={<div className="text-red-400 text-[8px]">Err</div>}
                                        >
                                            <Page
                                                pageNumber={slot.page || 1}
                                                width={60}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                            />
                                        </Document>
                                    </div>
                                ) : (
                                    <img
                                        src={assetUrl}
                                        alt={slot.image.name}
                                        className="h-full w-full object-cover"
                                        style={{ transform: `scale(${slot.zoom})` }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

