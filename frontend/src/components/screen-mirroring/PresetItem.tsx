// /src/components/screen-mirroring/PresetItem.tsx
import { PresetLayout } from 'types/api';
import { API_BASE_URL } from 'config';
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
                className="absolute -top-2 -right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-white opacity-0 transition-all hover:bg-red-600 group-hover:opacity-100"
                title="Delete preset"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            
            {/* Main preset container */}
            <div
                onClick={() => onLoad(preset)}
                className="flex h-full w-full cursor-pointer rounded-md border-2 border-gray-600 bg-gray-900 p-1 transition-all hover:border-blue-500 hover:shadow-lg"
            >

                {/* Mini preview grid */}
                <div className={clsx('grid h-full w-full gap-0.5', gridClasses[preset.layout_type])}>
                    {slots.map((slot) => {
                        const imageUrl = `${API_BASE_URL}/static/${slot.image.file_path.replace(/^public\//, '')}`;
                        return (
                            <div
                                key={slot.ID}
                                className="relative overflow-hidden rounded-sm bg-gray-800"
                            >
                                <img
                                    src={imageUrl}
                                    alt={slot.image.name}
                                    className="h-full w-full object-cover"
                                    style={{ transform: `scale(${slot.zoom})` }}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

