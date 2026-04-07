import { useState, forwardRef } from 'react';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import {
    adjustHp,
    removeCombatant,
    addStatusEffect,
    removeStatusEffect,
    adjustDeathSave,
    reviveCombatant,
    toggleSlot,
    selectTemplateForCombatant,
} from 'features/crawl/crawlSlice';
import { CharacterTemplate, Combatant, StatusEffect } from 'types/api';
import { API_BASE_URL } from 'config';
import { STATUS_EFFECT_COLORS } from './statusEffects';
import { StatusEffectPicker } from './StatusEffectPicker';
import { GlassVial } from 'components/ui/GlassVial';

function SpellSlotIcon({ level, used, onClick }: { level: number; used: boolean; onClick: () => void }) {
    return (
        <button onClick={onClick} className="group/slot relative" title={`Level ${level} spell slot`}>
            <svg width="22" height="26" viewBox="0 0 22 26" className="transition-transform hover:scale-110">
                <polygon
                    points="11,0 21,6.5 21,19.5 11,26 1,19.5 1,6.5"
                    fill={used ? '#1e3a5f' : '#3b82f6'}
                    stroke={used ? '#4b7099' : '#93c5fd'}
                    strokeWidth="1"
                    opacity={used ? 0.4 : 1}
                />
                {!used && (
                    <polygon
                        points="11,0 21,6.5 21,19.5 11,26 1,19.5 1,6.5"
                        fill="none"
                        stroke="#93c5fd"
                        strokeWidth="0.5"
                        opacity="0.5"
                        transform="scale(0.8) translate(2.75 2.6)"
                    />
                )}
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold ${used ? 'text-blue-300/40 line-through' : 'text-white'}`}>
                {level}
            </span>
        </button>
    );
}

function RageSlotIcon({ level, used, onClick }: { level: number; used: boolean; onClick: () => void }) {
    return (
        <button onClick={onClick} className="group/slot relative" title={`Level ${level} rage slot`}>
            <svg width="22" height="26" viewBox="0 0 22 26" className="transition-transform hover:scale-110">
                <path
                    d="M11,0 L16,4 L21,7 L19,14 L21,20 L16,24 L11,26 L6,24 L1,20 L3,14 L1,7 L6,4 Z"
                    fill={used ? '#5c3310' : '#f97316'}
                    stroke={used ? '#a36830' : '#fdba74'}
                    strokeWidth="1"
                    opacity={used ? 0.4 : 1}
                />
                {!used && (
                    <path
                        d="M11,3 L15,6 L19,8.5 L17.5,14 L19,19 L15,22 L11,23.5 L7,22 L3,19 L4.5,14 L3,8.5 L7,6 Z"
                        fill="none"
                        stroke="#fdba74"
                        strokeWidth="0.5"
                        opacity="0.5"
                    />
                )}
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold ${used ? 'text-orange-300/40 line-through' : 'text-white'}`}>
                {level}
            </span>
        </button>
    );
}

function SlotRow({ label, usage, slotType, instanceId, dispatch, color }: {
    label: string; usage: Combatant['spellSlotUsage']; slotType: 'spell' | 'rage';
    instanceId: string; dispatch: ReturnType<typeof useAppDispatch>; color: string;
}) {
    if (usage.length === 0) return null;
    const Icon = slotType === 'spell' ? SpellSlotIcon : RageSlotIcon;
    return (
        <div className="mt-1.5 w-full">
            <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5 text-center" style={{ color }}>{label}</p>
            <div className="flex flex-wrap justify-center gap-0.5">
                {usage.map(group =>
                    Array.from({ length: group.total }).map((_, i) => (
                        <Icon
                            key={`${group.level}-${i}`}
                            level={group.level}
                            used={group.usedSlots[i]}
                            onClick={() => dispatch(toggleSlot({ instanceId, slotType, level: group.level, slotIndex: i }))}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

interface CombatantCardProps {
    combatant: Combatant;
    isActive: boolean;
    showCopyIndex: boolean;
    onViewTemplate: (template: CharacterTemplate) => void;
}

function getHpLiquidClass(hp: number, maxHp: number): string {
    if (maxHp <= 0) return '';
    const ratio = hp / maxHp;
    if (ratio > 2 / 3) return 'bg-gradient-to-r from-green-800 via-green-500 to-green-800 shadow-[0_0_10px_rgba(34,197,94,0.5)]';
    if (ratio > 1 / 3) return 'bg-gradient-to-r from-orange-800 via-orange-500 to-orange-800 shadow-[0_0_10px_rgba(249,115,22,0.5)]';
    return '';
}

export const CombatantCard = forwardRef<HTMLDivElement, CombatantCardProps>(
    function CombatantCard({ combatant, isActive, showCopyIndex, onViewTemplate }, ref) {
        const dispatch = useAppDispatch();
        const templates = useAppSelector((state) => state.crawl.templates);
        const template = selectTemplateForCombatant(templates, combatant.templateId);
        const [showPicker, setShowPicker] = useState(false);

        const name = template?.name ?? '???';
        const defaultColor = template?.character_type === 'monster' ? '#5c4033' : '#374151';
        const color = template?.color ?? defaultColor;
        const photoPath = template?.photo_path;
        const raceClass = [template?.race, template?.class].filter(Boolean).join(' ');

        const hpPercent = combatant.max_hp > 0
            ? Math.round((combatant.hp / combatant.max_hp) * 100)
            : 0;

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
                className={`group relative flex w-48 flex-shrink-0 flex-col items-center rounded-lg border-2 border-paladin-gold/60 transition-all ${
                    isActive ? 'outline outline-3 outline-offset-4 outline-paladin-gold scale-105' : ''
                }`}
                style={{
                    backgroundColor: color,
                    boxShadow: blendedShadow,
                }}
            >
                {/* Dead overlay */}
                {combatant.isDead && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-black/70">
                        <span className="text-4xl">&#9760;</span>
                        <button
                            onClick={() => dispatch(reviveCombatant(combatant.instanceId))}
                            className="rounded bg-green-700/60 px-3 py-1 text-xs font-bold text-green-200 opacity-0 transition-opacity hover:bg-green-600/80 group-hover:opacity-100"
                        >
                            Revive
                        </button>
                    </div>
                )}

                {/* Death save overlay (PC only) */}
                {combatant.isInDeathSave && !combatant.isDead && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-black/80">
                        <p className="text-xs font-semibold text-white/60">
                            {name}
                            {showCopyIndex && <span className="ml-1 text-paladin-gold">#{combatant.copyIndex}</span>}
                        </p>
                        <p className="font-blackletter text-lg font-bold text-wax-red" style={{ textShadow: '0 0 10px rgba(153,27,27,0.6)' }}>
                            Death Save
                        </p>
                        <span className={`text-3xl font-bold ${
                            combatant.deathSaveCount > 0 ? 'text-green-400' :
                            combatant.deathSaveCount < 0 ? 'text-red-400' : 'text-white'
                        }`}>
                            {combatant.deathSaveCount > 0 ? `+${combatant.deathSaveCount}` : combatant.deathSaveCount}
                        </span>
                        <div className="flex gap-3">
                            <button
                                onClick={() => dispatch(adjustDeathSave({ instanceId: combatant.instanceId, delta: -1 }))}
                                className="rounded bg-red-700/60 px-4 py-1 text-sm font-bold text-red-200 hover:bg-red-600/80"
                            >
                                -1
                            </button>
                            <button
                                onClick={() => dispatch(adjustDeathSave({ instanceId: combatant.instanceId, delta: 1 }))}
                                className="rounded bg-green-700/60 px-4 py-1 text-sm font-bold text-green-200 hover:bg-green-600/80"
                            >
                                +1
                            </button>
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className="absolute right-1 top-1 z-20 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {template && (
                        <button
                            onClick={() => onViewTemplate(template)}
                            className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-white hover:bg-black/60"
                            title="View Stats"
                        >
                            &#128065;
                        </button>
                    )}
                    <button
                        onClick={() => dispatch(removeCombatant(combatant.instanceId))}
                        className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-red-300 hover:bg-black/60"
                        title="Remove from battle"
                    >
                        &#10005;
                    </button>
                </div>

                {/* Image filling top of card with fade */}
                {photoPath ? (
                    <div className="relative w-full h-28 overflow-hidden rounded-t-md">
                        <img
                            src={`${API_BASE_URL}/static/${photoPath}`}
                            alt={name}
                            className="h-full w-full object-cover"
                            style={{ objectPosition: `center ${template?.photo_offset_y ?? 50}%` }}
                        />
                        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 40%, ${color})` }} />
                    </div>
                ) : (
                    <div className="flex h-16 w-full items-center justify-center">
                        <span className="text-2xl text-white/60">&#9876;</span>
                    </div>
                )}

                {/* Name */}
                <p className="relative z-10 -mt-3 max-w-full truncate text-center text-sm font-bold text-white px-3" title={name}>
                    {name}
                    {showCopyIndex && (
                        <span className="ml-1 text-sm font-bold text-paladin-gold">#{combatant.copyIndex}</span>
                    )}
                </p>

                {/* Card content */}
                <div className="w-full px-3 pb-3 flex flex-col items-center">
                    {raceClass && (
                        <p className="max-w-full truncate text-center text-xs italic text-white/70" title={raceClass}>
                            {raceClass}
                        </p>
                    )}

                    <span className="mt-0.5 rounded-full bg-black/30 px-2 py-0.5 text-xs text-white">
                        Init {combatant.initiative}
                    </span>

                    <GlassVial
                        percent={hpPercent}
                        className="mt-1.5 mb-0.5 h-2.5"
                        liquidClassName={getHpLiquidClass(combatant.hp, combatant.max_hp)}
                    />
                    <p className="text-xs text-white/80">
                        {combatant.hp}/{combatant.max_hp} HP
                    </p>

                    <div className="mt-1.5 flex gap-1.5">
                        {[-10, -5, -1, 1].map((delta) => (
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

                    <div className="mt-1.5 flex items-center gap-1">
                        <span className="text-xs text-yellow-300">&#128737;</span>
                        <span className="text-xs font-semibold text-white">{combatant.ac}</span>
                    </div>

                    <SlotRow label="Spells" usage={combatant.spellSlotUsage} slotType="spell" instanceId={combatant.instanceId} dispatch={dispatch} color="#93c5fd" />
                    <SlotRow label="Rage" usage={combatant.rageSlotUsage} slotType="rage" instanceId={combatant.instanceId} dispatch={dispatch} color="#fdba74" />

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
                                immunities={template?.immunities ?? []}
                                onAdd={(effect: StatusEffect) =>
                                    dispatch(addStatusEffect({ instanceId: combatant.instanceId, effect }))
                                }
                                onClose={() => setShowPicker(false)}
                            />
                        )}
                    </div>
                </div>

                {/* Floating effect labels above card */}
                {activeEffects.length > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {activeEffects.map((effect) => {
                            const effectColor = STATUS_EFFECT_COLORS[effect];
                            return (
                                <div
                                    key={effect}
                                    className="group/effect relative whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white cursor-default"
                                    style={{
                                        backgroundColor: `${effectColor}22`,
                                        boxShadow: `0 0 12px 4px ${effectColor}30`,
                                        textShadow: `0 0 6px ${effectColor}`,
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
