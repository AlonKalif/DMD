import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { STATUS_EFFECTS, StatusEffect } from 'types/api';
import { STATUS_EFFECT_COLORS } from './statusEffects';

interface StatusEffectPickerProps {
    appliedEffects: StatusEffect[];
    immunities: string[];
    onAdd: (effect: StatusEffect) => void;
    onClose: () => void;
    anchorRef: React.RefObject<HTMLElement | null>;
}

export function StatusEffectPicker({ appliedEffects, immunities, onAdd, onClose, anchorRef }: StatusEffectPickerProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => {
        if (anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            setPos({
                top: rect.top - 4,
                left: rect.left + rect.width / 2,
            });
        }
    }, [anchorRef]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    if (!pos) return null;

    return createPortal(
        <div
            ref={ref}
            className="fixed z-[100] w-80 -translate-x-1/2 rounded-md border border-paladin-gold/30 leather-card p-3 shadow-lg"
            style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -100%)' }}
        >
            <div className="grid grid-cols-3 gap-2">
                {STATUS_EFFECTS.map((effect) => {
                    const isApplied = appliedEffects.includes(effect);
                    const isImmune = immunities.includes(effect);
                    const disabled = isApplied || isImmune;
                    const color = STATUS_EFFECT_COLORS[effect];
                    return (
                        <button
                            key={effect}
                            type="button"
                            disabled={disabled}
                            onClick={() => { onAdd(effect); onClose(); }}
                            className={`relative rounded-lg px-2 py-1.5 text-[11px] font-semibold leading-tight text-center transition-all border ${
                                disabled
                                    ? 'cursor-default opacity-25 border-transparent'
                                    : 'text-white hover:scale-105'
                            }`}
                            style={disabled ? { backgroundColor: `${color}40` } : {
                                backgroundColor: `${color}20`,
                                borderColor: `${color}80`,
                                boxShadow: `inset 0 0 12px ${color}25, 0 0 8px ${color}30`,
                                textShadow: `0 0 6px ${color}`,
                            }}
                            title={isImmune ? `Immune to ${effect}` : effect}
                        >
                            {effect}
                            {isImmune && (
                                <span className="absolute -top-2 -right-2 rounded-full bg-paladin-gold px-1.5 py-0.5 text-[7px] font-bold text-ink leading-none shadow-md">
                                    Immune
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>,
        document.body
    );
}
