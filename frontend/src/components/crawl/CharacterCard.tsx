import { useDrag } from 'react-dnd';
import { CharacterTemplate } from 'types/api';
import { API_BASE_URL } from 'config';
import { DND_TYPES } from './dndTypes';

interface CharacterCardProps {
    template: CharacterTemplate;
    onEdit: (template: CharacterTemplate) => void;
    onDelete: (id: number) => void;
    onDoubleClick: (template: CharacterTemplate) => void;
}

function getHpBarColor(hp: number, maxHp: number): string {
    if (maxHp <= 0) return 'bg-gray-500';
    const ratio = hp / maxHp;
    if (ratio > 2 / 3) return 'bg-green-400';
    if (ratio > 1 / 3) return 'bg-orange-400';
    return 'bg-red-500';
}

export function CharacterCard({ template, onEdit, onDelete, onDoubleClick }: CharacterCardProps) {
    const [{ isDragging }, dragRef] = useDrag(() => ({
        type: DND_TYPES.BANK_CHARACTER,
        item: { template },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), [template]);

    const hpPercent = template.max_hp > 0
        ? Math.round((template.hp / template.max_hp) * 100)
        : 0;

    const bgColor = template.color || '#374151';

    const raceClass = [template.race, template.class].filter(Boolean).join(' ');

    return (
        <div
            ref={dragRef as unknown as React.Ref<HTMLDivElement>}
            className="group relative flex w-36 flex-col items-center rounded-lg p-3 shadow-md transition-transform hover:scale-105 cursor-grab active:cursor-grabbing"
            style={{
                backgroundColor: bgColor,
                opacity: isDragging ? 0.5 : 1,
            }}
            onDoubleClick={() => onDoubleClick(template)}
        >
            {/* Hover action buttons */}
            <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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

            {/* Photo or placeholder */}
            <div className="mb-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-black/20">
                {template.photo_path ? (
                    <img
                        src={`${API_BASE_URL}/static/${template.photo_path}`}
                        alt={template.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <span className="text-2xl text-white/60">&#9876;</span>
                )}
            </div>

            {/* Name */}
            <p className="max-w-full truncate text-center text-sm font-bold text-white" title={template.name}>
                {template.name}
            </p>

            {/* Race / Class */}
            {raceClass && (
                <p className="max-w-full truncate text-center text-xs italic text-white/70" title={raceClass}>
                    {raceClass}
                </p>
            )}

            {/* Level badge */}
            <span className="mt-1 mb-1 rounded-full bg-black/30 px-2 py-0.5 text-xs text-white">
                Lv {template.level}
            </span>

            {/* HP bar */}
            <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-black/30">
                <div
                    className={`h-full rounded-full transition-all ${getHpBarColor(template.hp, template.max_hp)}`}
                    style={{ width: `${hpPercent}%` }}
                />
            </div>
            <p className="text-xs text-white/80">
                {template.hp}/{template.max_hp} HP
            </p>

            {/* AC */}
            <div className="mt-1 flex items-center gap-1">
                <span className="text-xs text-yellow-300">&#128737;</span>
                <span className="text-xs font-semibold text-white">{template.ac}</span>
            </div>
        </div>
    );
}
