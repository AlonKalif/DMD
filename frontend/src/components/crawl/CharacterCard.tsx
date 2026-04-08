import { useDrag } from 'react-dnd';
import { CharacterTemplate } from 'types/api';
import { API_BASE_URL } from 'config';
import { DND_TYPES } from './dndTypes';

interface CharacterCardProps {
    template: CharacterTemplate;
    onEdit: (template: CharacterTemplate) => void;
    onDelete: (id: number) => void;
    onDoubleClick: (template: CharacterTemplate) => void;
    onView: (template: CharacterTemplate) => void;
}

export function CharacterCard({ template, onEdit, onDelete, onDoubleClick, onView }: CharacterCardProps) {
    const [{ isDragging }, dragRef] = useDrag(() => ({
        type: DND_TYPES.BANK_CHARACTER,
        item: { template },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), [template]);

    const defaultColor = template.character_type === 'monster' ? '#5c4033' : '#374151';
    const bgColor = template.color || defaultColor;

    const raceClass = [template.race, template.class].filter(Boolean).join(' ');

    return (
        <div
            ref={dragRef as unknown as React.Ref<HTMLDivElement>}
            className="group relative flex w-40 flex-col items-center overflow-hidden rounded-lg border-2 border-paladin-gold/60 shadow-md transition-transform hover:scale-105 cursor-grab active:cursor-grabbing"
            style={{
                backgroundColor: bgColor,
                opacity: isDragging ? 0.5 : 1,
            }}
            onDoubleClick={() => onDoubleClick(template)}
        >
            {/* Hover action buttons */}
            <div className="absolute right-1 top-1 z-20 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                    onClick={(e) => { e.stopPropagation(); onView(template); }}
                    className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-white hover:bg-black/60"
                    title="View Stats"
                >
                    &#128065;
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(template); }}
                    className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-white hover:bg-black/60"
                    title="Edit"
                >
                    &#9998;
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(template.ID); }}
                    className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-red-300 hover:bg-black/60"
                    title="Delete"
                >
                    &#10005;
                </button>
            </div>

            {/* Image filling top of card with fade */}
            {template.photo_path ? (
                <div className="relative w-full h-32">
                    <img
                        src={`${API_BASE_URL}/static/${template.photo_path}`}
                        alt={template.name}
                        className="h-full w-full object-cover"
                        style={{ objectPosition: `center ${template.photo_offset_y ?? 50}%` }}
                    />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 40%, ${bgColor})` }} />
                </div>
            ) : (
                <div className="flex h-20 w-full items-center justify-center">
                    <img src="/dmd_logo.png" alt="" className="h-14 w-14 object-contain opacity-20" />
                </div>
            )}

            {/* Text content */}
            <div className="w-full px-3 pb-3 -mt-3 relative z-10 flex flex-col items-center">
                <p className="max-w-full truncate text-center text-base font-bold text-white" title={template.name}>
                    {template.name}
                </p>

                {raceClass && (
                    <p className="max-w-full truncate text-center text-sm italic text-white/70" title={raceClass}>
                        {raceClass}
                    </p>
                )}

                <span className="mt-1 mb-1 rounded-full bg-black/30 px-2.5 py-0.5 text-sm text-white">
                    Lv {template.level}
                </span>

                <p className="text-sm text-white/80">
                    {template.max_hp} HP
                </p>

                <div className="mt-1 flex items-center gap-1">
                    <span className="text-sm text-yellow-300">&#128737;</span>
                    <span className="text-sm font-semibold text-white">{template.ac}</span>
                </div>
            </div>

        </div>
    );
}
