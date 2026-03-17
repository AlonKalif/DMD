import { useState, forwardRef } from 'react';
import { useAppDispatch } from 'app/hooks';
import { adjustHp, removeCombatant, addStatusEffect, removeStatusEffect } from 'features/crawl/crawlSlice';
import { Combatant, StatusEffect } from 'types/api';
import { API_BASE_URL } from 'config';
import { STATUS_EFFECT_COLORS } from './statusEffects';
import { StatusEffectPicker } from './StatusEffectPicker';
import { GlassVial } from 'components/ui/GlassVial';

interface CombatantCardProps {
    combatant: Combatant;
    isActive: boolean;
}

function getHpLiquidClass(hp: number, maxHp: number): string {
    if (maxHp <= 0) return '';
    const ratio = hp / maxHp;
    if (ratio > 2 / 3) return 'bg-gradient-to-r from-green-800 via-green-500 to-green-800 shadow-[0_0_10px_rgba(34,197,94,0.5)]';
    if (ratio > 1 / 3) return 'bg-gradient-to-r from-orange-800 via-orange-500 to-orange-800 shadow-[0_0_10px_rgba(249,115,22,0.5)]';
    return '';
}

export const CombatantCard = forwardRef<HTMLDivElement, CombatantCardProps>(
    function CombatantCard({ combatant, isActive }, ref) {
        const dispatch = useAppDispatch();
        const [showPicker, setShowPicker] = useState(false);

        const hpPercent = combatant.max_hp > 0
            ? Math.round((combatant.hp / combatant.max_hp) * 100)
            : 0;

        const raceClass = [combatant.race, combatant.class].filter(Boolean).join(' ');

        const activeEffects = combatant.statusEffects;
        const effectColors = activeEffects.map((e) => STATUS_EFFECT_COLORS[e]);

        const blendedShadow = effectColors.length > 0
            ? effectColors
                .map((c) => `0 0 12px 3px ${c}aa, 0 0 24px 6px ${c}44`)
                .join(', ')
            : '0 4px 6px -1px rgba(0,0,0,0.3)';

        return (
            <div
                ref={ref}
                className={`group relative flex w-48 flex-shrink-0 flex-col items-center rounded-lg border-2 border-paladin-gold/60 p-4 transition-all ${
                    isActive ? 'outline outline-3 outline-offset-4 outline-paladin-gold scale-105' : ''
                }`}
                style={{
                    backgroundColor: combatant.color || '#374151',
                    boxShadow: blendedShadow,
                }}
            >
                {/* Death overlay */}
                {combatant.isDead && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/70">
                        <span className="text-4xl">&#9760;</span>
                    </div>
                )}

                {/* Remove button */}
                <button
                    onClick={() => dispatch(removeCombatant(combatant.instanceId))}
                    className="absolute right-1 top-1 z-20 rounded bg-black/40 px-1.5 py-0.5 text-xs text-red-300 opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
                    title="Remove from battle"
                >
                    &#10005;
                </button>

                {/* Photo */}
                <div className="mb-1.5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-black/20">
                    {combatant.photo_path ? (
                        <img
                            src={`${API_BASE_URL}/static/${combatant.photo_path}`}
                            alt={combatant.name}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span className="text-2xl text-white/60">&#9876;</span>
                    )}
                </div>

                {/* Name */}
                <p className="max-w-full truncate text-center text-sm font-bold text-white" title={combatant.name}>
                    {combatant.name}
                </p>

                {/* Race / Class */}
                {raceClass && (
                    <p className="max-w-full truncate text-center text-xs italic text-white/70" title={raceClass}>
                        {raceClass}
                    </p>
                )}

                {/* Initiative badge */}
                <span className="mt-0.5 rounded-full bg-black/30 px-2 py-0.5 text-xs text-white">
                    Init {combatant.initiative}
                </span>

                {/* HP bar */}
                <GlassVial
                    percent={hpPercent}
                    className="mt-1.5 mb-0.5 h-2.5"
                    liquidClassName={getHpLiquidClass(combatant.hp, combatant.max_hp)}
                />
                <p className="text-xs text-white/80">
                    {combatant.hp}/{combatant.max_hp} HP
                </p>

                {/* HP buttons */}
                <div className="mt-1.5 flex gap-1.5">
                    {[-5, -1, 1, 5].map((delta) => (
                        <button
                            key={delta}
                            onClick={() => dispatch(adjustHp({ instanceId: combatant.instanceId, delta }))}
                            className={`rounded px-2 py-0.5 text-xs font-bold transition-colors ${
                                delta < 0
                                    ? 'bg-red-700/60 text-red-200 hover:bg-red-600/80'
                                    : 'bg-green-700/60 text-green-200 hover:bg-green-600/80'
                            }`}
                        >
                            {delta > 0 ? `+${delta}` : delta}
                        </button>
                    ))}
                </div>

                {/* AC */}
                <div className="mt-1.5 flex items-center gap-1">
                    <span className="text-xs text-yellow-300">&#128737;</span>
                    <span className="text-xs font-semibold text-white">{combatant.ac}</span>
                </div>

                {/* Add status effect button */}
                <div className="relative mt-1">
                    <button
                        onClick={() => setShowPicker(!showPicker)}
                        className="rounded bg-black/30 px-2.5 py-0.5 text-xs text-white/70 hover:bg-black/50 hover:text-white"
                    >
                        + Effect
                    </button>
                    {showPicker && (
                        <StatusEffectPicker
                            appliedEffects={combatant.statusEffects}
                            onAdd={(effect: StatusEffect) =>
                                dispatch(addStatusEffect({ instanceId: combatant.instanceId, effect }))
                            }
                            onClose={() => setShowPicker(false)}
                        />
                    )}
                </div>

                {/* Floating effect labels above card */}
                {activeEffects.length > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {activeEffects.map((effect) => {
                            const color = STATUS_EFFECT_COLORS[effect];
                            return (
                                <div
                                    key={effect}
                                    className="group/effect relative whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white cursor-default"
                                    style={{
                                        backgroundColor: `${color}22`,
                                        boxShadow: `0 0 12px 4px ${color}30`,
                                        textShadow: `0 0 6px ${color}`,
                                    }}
                                >
                                    {effect}
                                    <button
                                        onClick={() => dispatch(removeStatusEffect({ instanceId: combatant.instanceId, effect }))}
                                        className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-black/70 text-[9px] text-white/80 hover:bg-red-700 hover:text-white group-hover/effect:flex"
                                    >
                                        &times;
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }
);
