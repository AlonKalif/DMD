import { useRef, useEffect } from 'react';
import { STATUS_EFFECTS, StatusEffect } from 'types/api';
import { STATUS_EFFECT_COLORS } from './statusEffects';

interface StatusEffectPickerProps {
    appliedEffects: StatusEffect[];
    onAdd: (effect: StatusEffect) => void;
    onClose: () => void;
}

export function StatusEffectPicker({ appliedEffects, onAdd, onClose }: StatusEffectPickerProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={ref}
            className="absolute left-0 top-full z-40 mt-1 max-h-48 w-44 overflow-y-auto rounded-md border border-paladin-gold/30 leather-card py-1 shadow-lg"
        >
            {STATUS_EFFECTS.map((effect) => {
                const isApplied = appliedEffects.includes(effect);
                return (
                    <button
                        key={effect}
                        type="button"
                        disabled={isApplied}
                        onClick={() => { onAdd(effect); onClose(); }}
                        className={`flex w-full items-center gap-2 px-3 py-1 text-left text-xs transition-colors ${
                            isApplied
                                ? 'cursor-default text-faded-ink/50'
                                : 'text-parchment hover:bg-paladin-gold/10'
                        }`}
                    >
                        <span
                            className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: STATUS_EFFECT_COLORS[effect] }}
                        />
                        {effect}
                    </button>
                );
            })}
        </div>
    );
}
