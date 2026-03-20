import { useRef, useEffect } from 'react';
import { STATUS_EFFECTS, StatusEffect } from 'types/api';
import { STATUS_EFFECT_COLORS } from './statusEffects';

interface StatusEffectPickerProps {
    appliedEffects: StatusEffect[];
    immunities: string[];
    onAdd: (effect: StatusEffect) => void;
    onClose: () => void;
}

export function StatusEffectPicker({ appliedEffects, immunities, onAdd, onClose }: StatusEffectPickerProps) {
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
            className="absolute left-1/2 -translate-x-1/2 bottom-full z-40 mb-1 w-80 rounded-md border border-paladin-gold/30 leather-card p-3 shadow-lg"
        >
            <div className="grid grid-cols-3 gap-2">
                {STATUS_EFFECTS.map((effect) => {
                    const isApplied = appliedEffects.includes(effect);
                    const isImmune = immunities.includes(effect);
                    const disabled = isApplied || isImmune;
                    return (
                        <button
                            key={effect}
                            type="button"
                            disabled={disabled}
                            onClick={() => { onAdd(effect); onClose(); }}
                            className={`relative rounded-full px-2 py-1 text-xs font-medium leading-tight text-center transition-colors ${
                                disabled
                                    ? 'cursor-default opacity-30'
                                    : 'text-white hover:scale-105 hover:brightness-125'
                            }`}
                            style={{ backgroundColor: STATUS_EFFECT_COLORS[effect] }}
                            title={isImmune ? `Immune to ${effect}` : effect}
                        >
                            {effect}
                            {isImmune && (
                                <span className="absolute -top-1.5 -right-1.5 rounded-full bg-paladin-gold px-1 py-px text-[8px] font-bold text-ink leading-none">
                                    Immune
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
