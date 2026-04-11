import { useState, useRef, forwardRef } from 'react';
import { useDrag } from 'react-dnd';
import { useAppDispatch } from 'app/hooks';
import {
    adjustHp,
    removeCombatant,
    addStatusEffect,
    removeStatusEffect,
    adjustDeathSave,
    reviveCombatant,
    toggleSlot,
} from 'features/crawl/crawlSlice';
import { CharacterTemplate, Combatant, ResourceSlot, StatusEffect } from 'types/api';
import { API_BASE_URL } from 'config';
import { DND_TYPES } from './dndTypes';
import { STATUS_EFFECT_COLORS } from './statusEffects';
import { StatusEffectPicker } from './StatusEffectPicker';
import { GlassVial } from 'components/ui/GlassVial';

// ── SVG Icon Components ────────────────────────────────────────────────

function HpIcon() {
    return (
        <svg width="32" height="32" viewBox="-1 -1 26 26" fill="currentColor" className="text-red-500" style={{ filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.7))' }}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            <path d="M12 6.5l-.5-.5C10.5 5 9 4.5 7.5 4.5 5.5 4.5 4 6 4 8c0 2.5 2.5 5 8 10 5.5-5 8-7.5 8-10 0-2-1.5-3.5-3.5-3.5-1.5 0-3 .5-4 1.5l-.5.5z" fill="#000" fillOpacity="0.15" />
        </svg>
    );
}

function AcIcon() {
    return (
        <svg width="32" height="32" viewBox="-1 -1 26 26" fill="currentColor" className="text-blue-400" style={{ filter: 'drop-shadow(0 0 4px rgba(96,165,250,0.6))' }}>
            <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
            <path d="M12 5l-4 1.5v4.59c0 2.8 1.7 5.4 4 6.3 2.3-.9 4-3.5 4-6.3V6.5L12 5z" fill="#000" fillOpacity="0.2" />
        </svg>
    );
}

function InitIcon({ value }: { value?: number }) {
    return (
        <div className="relative flex-shrink-0">
            <svg width="32" height="32" viewBox="-1 -1 26 26" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.7))' }}>
                <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" fill="currentColor" fillOpacity="0.15" />
                <path d="M12 2v20M3 7l18 0M3 17l18 0M12 7l9 10M12 7l-9 10" strokeOpacity="0.4" />
            </svg>
            {value !== undefined && (
                <span
                    className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-white"
                    style={{ WebkitTextStroke: '2px #78350f', paintOrder: 'stroke fill' } as any}
                >
                    {value}
                </span>
            )}
        </div>
    );
}

function StatsIcon() {
    return (
        <svg width="32" height="32" viewBox="-1 -1 26 26" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-purple-400" style={{ filter: 'drop-shadow(0 0 4px rgba(192,132,252,0.7))' }}>
            <path d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" fill="currentColor" fillOpacity="0.15" />
            <path d="M5 17h14M5 7h14" strokeLinecap="round" />
            <path d="M9 11h6M9 14h4" strokeOpacity="0.5" />
        </svg>
    );
}

function StatusEffectIcon() {
    return (
        <svg width="32" height="32" viewBox="-1 -1 26 26" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400" style={{ filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.7))' }}>
            <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.1" />
            <path d="M12 3c-3 3-7 5-9 9 2 4 6 6 9 9 3-3 7-5 9-9-2-4-6-6-9-9z" fill="currentColor" fillOpacity="0.15" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
    );
}

function SpellSlotIcon({ level, used, onClick }: { level: number; used: boolean; onClick?: () => void }) {
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag onClick={onClick} className={`relative ${onClick ? 'transition-transform hover:scale-110' : ''}`} title={`Level ${level} spell slot`}>
            <svg width="32" height="32" viewBox="-1 -1 26 26" fill="none" stroke="currentColor" strokeWidth="1.5"
                className={used ? 'text-cyan-900' : 'text-cyan-300'}
                style={used ? undefined : { filter: 'drop-shadow(0 0 5px rgba(96,165,250,0.9))' }}
                opacity={used ? 0.35 : 1}
            >
                <path d="M12 2l2 7h7l-6 4 2 8-5-5-5 5 2-8-6-4h7l2-7z" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span
                className={`absolute inset-0 flex items-center justify-center pt-[2px] text-[11px] font-extrabold ${used ? 'text-cyan-400/30 line-through' : 'text-white'}`}
                style={used ? undefined : { WebkitTextStroke: '2px #0c4a6e', paintOrder: 'stroke fill' } as any}
            >
                {level}
            </span>
        </Tag>
    );
}

function RageSlotIcon({ level, used, onClick }: { level: number; used: boolean; onClick?: () => void }) {
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag onClick={onClick} className={`relative ${onClick ? 'transition-transform hover:scale-110' : ''}`} title={`Level ${level} rage slot`}>
            <svg width="32" height="32" viewBox="-1 -1 26 26" fill="currentColor"
                className={used ? 'text-orange-950' : 'text-orange-400'}
                style={used ? undefined : { filter: 'drop-shadow(0 0 5px rgba(249,115,22,0.9))' }}
                opacity={used ? 0.35 : 1}
            >
                <path d="M12 2c0 0-4 4.5-4 9.5s3.5 8.5 8 8.5c-1.5-1-2.5-3-2.5-5 0-3.5 4.5-6.5 4.5-6.5C18 12 15 16 15 16s-2-2-2-4 2.5-4 2.5-4C13 8 12 2 12 2z" />
                <path d="M8 12c0 0-2 2-2 5s2 5 5 5c-1-1-1.5-2.5-1.5-4 0-2 2.5-4 2.5-4s-1-2-4-2z" fill="#000" fillOpacity="0.2" />
            </svg>
            <span
                className={`absolute inset-0 flex items-center justify-center pt-[2px] text-[11px] font-extrabold ${used ? 'text-orange-300/30 line-through' : 'text-white'}`}
                style={used ? undefined : { WebkitTextStroke: '2px #5c2200', paintOrder: 'stroke fill' } as any}
            >
                {level}
            </span>
        </Tag>
    );
}

function SlotRow({ usage, slotType, instanceId, dispatch }: {
    usage: Combatant['spellSlotUsage']; slotType: 'spell' | 'rage';
    instanceId: string; dispatch: ReturnType<typeof useAppDispatch>;
}) {
    if (usage.length === 0) return null;
    const Icon = slotType === 'spell' ? SpellSlotIcon : RageSlotIcon;
    return (
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
    );
}

function BankSlotRow({ slots, slotType }: { slots: ResourceSlot[]; slotType: 'spell' | 'rage' }) {
    if (!slots || slots.length === 0) return null;
    const Icon = slotType === 'spell' ? SpellSlotIcon : RageSlotIcon;
    return (
        <div className="flex flex-wrap justify-center gap-0.5">
            {slots.map(slot =>
                Array.from({ length: slot.count }).map((_, i) => (
                    <Icon key={`${slot.level}-${i}`} level={slot.level} used={false} />
                ))
            )}
        </div>
    );
}

// ── Helpers ─────────────────────────────────────────────────────────────

function getHpLiquidClass(hp: number, maxHp: number): string {
    if (maxHp <= 0) return '';
    const ratio = hp / maxHp;
    if (ratio > 2 / 3) return 'bg-gradient-to-r from-green-800 via-green-500 to-green-800 shadow-[0_0_10px_rgba(34,197,94,0.5)]';
    if (ratio > 1 / 3) return 'bg-gradient-to-r from-orange-800 via-orange-500 to-orange-800 shadow-[0_0_10px_rgba(249,115,22,0.5)]';
    return '';
}

function getHpBandClass(hp: number, maxHp: number): string {
    if (maxHp <= 0) return 'bg-gray-700';
    const ratio = hp / maxHp;
    if (ratio > 2 / 3) return 'bg-gradient-to-r from-green-800 via-green-500 to-green-800 shadow-[0_0_10px_rgba(34,197,94,0.5)]';
    if (ratio > 1 / 3) return 'bg-gradient-to-r from-orange-800 via-orange-500 to-orange-800 shadow-[0_0_10px_rgba(249,115,22,0.5)]';
    return 'bg-gradient-to-r from-red-900 via-red-600 to-red-900 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
}

function PlayerSlotRow({ usage, slotType }: { usage: Combatant['spellSlotUsage']; slotType: 'spell' | 'rage' }) {
    if (usage.length === 0) return null;
    const Icon = slotType === 'spell' ? SpellSlotIcon : RageSlotIcon;
    return (
        <div className="flex flex-wrap justify-center gap-0.5">
            {usage.map(group =>
                Array.from({ length: group.total }).map((_, i) => (
                    <Icon key={`${group.level}-${i}`} level={group.level} used={group.usedSlots[i]} />
                ))
            )}
        </div>
    );
}

// ── Props ───────────────────────────────────────────────────────────────

type CardMode = 'bank' | 'combat' | 'player';

interface CreatureCardProps {
    template: CharacterTemplate;
    mode: CardMode;
    onEdit?: (t: CharacterTemplate) => void;
    onDelete?: (id: number) => void;
    onDoubleClick?: (t: CharacterTemplate) => void;
    combatant?: Combatant;
    isActive?: boolean;
    showCopyIndex?: boolean;
    onViewTemplate?: (t: CharacterTemplate) => void;
}

// ── Component ───────────────────────────────────────────────────────────

export const CreatureCard = forwardRef<HTMLDivElement, CreatureCardProps>(
    function CreatureCard(
        { template, mode, onEdit, onDelete, onDoubleClick, combatant, isActive, showCopyIndex, onViewTemplate },
        ref,
    ) {
        const dispatch = useAppDispatch();
        const [showPicker, setShowPicker] = useState(false);
        const effectBtnRef = useRef<HTMLButtonElement>(null);

        const isCombat = mode === 'combat';
        const isBank = mode === 'bank';
        const isPlayer = mode === 'player';
        const showsCombatData = isCombat || isPlayer;

        // useDrag must be called unconditionally (rules of hooks)
        const [{ isDragging }, dragRef] = useDrag(() => ({
            type: DND_TYPES.BANK_CHARACTER,
            item: { template },
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
        }), [template]);

        const name = template.name;
        const defaultColor = template.character_type === 'monster' ? '#5c4033' : '#374151';
        const color = template.color || defaultColor;
        const photoPath = template.photo_path;
        const raceClass = [template.race, template.class].filter(Boolean).join(' ');

        const hp = combatant?.hp ?? template.max_hp;
        const maxHp = combatant?.max_hp ?? template.max_hp;
        const ac = combatant?.ac ?? template.ac;

        const hpPercent = maxHp > 0 ? Math.round((hp / maxHp) * 100) : 0;

        const activeEffects = combatant?.statusEffects ?? [];
        const effectColors = activeEffects.map((e) => STATUS_EFFECT_COLORS[e]);

        const blendedShadow = showsCombatData && effectColors.length > 0
            ? effectColors
                .map((c) => `0 0 12px 3px ${c}aa, 0 0 24px 6px ${c}44`)
                .join(', ')
            : '0 4px 6px -1px rgba(0,0,0,0.3)';

        // Merge forwarded ref + drag ref for bank mode
        const setRef = (el: HTMLDivElement | null) => {
            if (typeof ref === 'function') ref(el);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
            if (isBank) (dragRef as any)(el);
        };

        return (
            <div
                ref={setRef}
                className={`group relative flex w-48 h-80 flex-shrink-0 flex-col items-center rounded-lg border-2 border-paladin-gold/60 transition-all ${
                    isBank ? 'cursor-grab active:cursor-grabbing hover:scale-105' : ''
                } ${showsCombatData && isActive ? 'outline outline-3 outline-offset-4 outline-paladin-gold scale-105' : ''}`}
                style={{
                    backgroundColor: color,
                    boxShadow: blendedShadow,
                    opacity: isBank && isDragging ? 0.5 : 1,
                }}
                onDoubleClick={isBank && onDoubleClick ? () => onDoubleClick(template) : undefined}
            >
                {/* ── Dead overlay (combat + player) ────────────────── */}
                {showsCombatData && combatant?.isDead && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-black/70">
                        <span className="text-4xl">&#9760;</span>
                        {isCombat && (
                            <button
                                onClick={() => dispatch(reviveCombatant(combatant.instanceId))}
                                className="rounded bg-green-700/60 px-3 py-1 text-xs font-bold text-green-200 opacity-0 transition-opacity hover:bg-green-600/80 group-hover:opacity-100"
                            >
                                Revive
                            </button>
                        )}
                    </div>
                )}

                {/* ── Death save overlay (combat + player) ──────────── */}
                {showsCombatData && combatant?.isInDeathSave && !combatant.isDead && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-black/80">
                        <p className="text-xs font-semibold text-white/60">
                            {name}
                            {showCopyIndex && <span className="ml-1 text-paladin-gold">#{combatant.copyIndex}</span>}
                        </p>
                        <p
                            className="font-blackletter text-2xl font-bold text-wax-red"
                            style={{ textShadow: '0 0 10px rgba(153,27,27,0.6)', WebkitTextStroke: '0.7px rgba(255, 2, 2, 0.57)', paintOrder: 'stroke fill' } as any}
                        >
                            Death Save
                        </p>
                        {isCombat && (
                            <>
                                <span className={`text-3xl font-bold ${
                                    combatant.deathSaveCount > 0 ? 'text-green-400' :
                                    combatant.deathSaveCount < 0 ? 'text-red-400' : 'text-white'
                                }`}>
                                    {combatant.deathSaveCount > 0 ? `+${combatant.deathSaveCount}` : combatant.deathSaveCount}
                                </span>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => dispatch(adjustDeathSave({ instanceId: combatant.instanceId, delta: -1 }))}
                                        className="flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-rose-500/60 bg-rose-950/40 px-2.5 transition-colors hover:bg-rose-900/60"
                                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
                                    >
                                        <span className="text-sm font-bold leading-none text-rose-400">-1</span>
                                    </button>
                                    <button
                                        onClick={() => dispatch(adjustDeathSave({ instanceId: combatant.instanceId, delta: 1 }))}
                                        className="flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-emerald-500/60 bg-emerald-950/40 px-2.5 transition-colors hover:bg-emerald-900/60"
                                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
                                    >
                                        <span className="text-sm font-bold leading-none text-emerald-400">+1</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── Hover action buttons (top-right, hidden in player mode) */}
                {!isPlayer && <div className="absolute right-1 top-1 z-20 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {isBank && onEdit && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(template); }}
                            className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-white hover:bg-black/60"
                            title="Edit"
                        >
                            &#9998;
                        </button>
                    )}
                    {isBank && onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(template.ID); }}
                            className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-red-300 hover:bg-black/60"
                            title="Delete"
                        >
                            &#10005;
                        </button>
                    )}
                    {isCombat && combatant && (
                        <button
                            onClick={() => dispatch(removeCombatant(combatant.instanceId))}
                            className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-red-300 hover:bg-black/60"
                            title="Remove from battle"
                        >
                            &#10005;
                        </button>
                    )}
                </div>}

                {/* ── Image area ──────────────────────────────────────── */}
                {photoPath ? (
                    <div className="relative w-full flex-1 min-h-0 overflow-hidden rounded-t-md">
                        <img
                            src={`${API_BASE_URL}/static/${photoPath}`}
                            alt={name}
                            className="h-full w-full object-cover"
                            style={{ objectPosition: `center ${template.photo_offset_y ?? 50}%` }}
                        />
                        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 40%, ${color})` }} />
                    </div>
                ) : (
                    <div className="flex flex-1 min-h-0 w-full items-center justify-center">
                        <img src="/dmd_logo.png" alt="" className="h-3/4 w-3/4 object-contain opacity-20" />
                    </div>
                )}

                {/* ── Card content ────────────────────────────────────── */}
                <div className="relative z-[5] w-full px-2 pb-2 -mt-3 flex flex-col items-center">
                    {/* Row 1: Init | Name | Stats */}
                    <div className="flex w-full items-center gap-0.5">
                        <InitIcon value={showsCombatData ? combatant?.initiative : undefined} />
                        <p
                            className="flex-1 min-w-0 truncate text-center text-base font-bold font-blackletter text-amber-50"
                            title={name}
                            style={{ textShadow: '0 0 6px rgba(212,175,55,0.5), 0 1px 3px rgba(0,0,0,0.8)' }}
                        >
                            {name}
                            {showsCombatData && showCopyIndex && combatant && (
                                <span className="ml-1 text-paladin-gold/70">#{combatant.copyIndex}</span>
                            )}
                        </p>
                        {!isPlayer && onViewTemplate && (
                            <button
                                onClick={() => onViewTemplate(template)}
                                className="flex-shrink-0 transition-transform hover:scale-110"
                                title="View Stats"
                            >
                                <StatsIcon />
                            </button>
                        )}
                    </div>

                    {raceClass && (
                        <p className="max-w-full truncate text-center text-[10px] italic text-white/70" title={raceClass}>
                            {raceClass}
                        </p>
                    )}

                    {/* Row 2: HP & AC (hidden in player mode) */}
                    {!isPlayer && (
                        <div className="flex w-full items-center justify-center gap-2 -mt-0.5">
                            <div className="flex items-center gap-0.5">
                                <HpIcon />
                                <span className="text-xs font-semibold text-white">{hp}/{maxHp}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <AcIcon />
                                <span className="text-xs font-semibold text-white">{ac}</span>
                            </div>
                        </div>
                    )}

                    {/* Row 3: Health bar (full-width color band in player mode) */}
                    {isPlayer ? (
                        <div className={`mt-0.5 mb-1.5 h-2 w-full rounded-full ${getHpBandClass(hp, maxHp)}`} />
                    ) : (
                        <GlassVial
                            percent={hpPercent}
                            className="mt-0.5 mb-1.5 h-2"
                            liquidClassName={getHpLiquidClass(hp, maxHp)}
                        />
                    )}

                    {/* Row 4: HP adjustment + status effect (combat only) */}
                    {isCombat && combatant && (
                        <div className="flex items-center gap-1">
                            {[-10, -5, -1, 1].map((delta) => {
                                const isHeal = delta > 0;
                                return (
                                    <button
                                        key={delta}
                                        onClick={() => dispatch(adjustHp({ instanceId: combatant.instanceId, delta }))}
                                        className={`flex h-7 min-w-7 items-center justify-center rounded-full border-2 px-1.5 transition-colors ${
                                            isHeal
                                                ? 'border-emerald-500/60 bg-emerald-950/40 hover:bg-emerald-900/60'
                                                : 'border-rose-500/60 bg-rose-950/40 hover:bg-rose-900/60'
                                        }`}
                                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
                                    >
                                        <span className={`text-[10px] font-bold leading-none ${isHeal ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {delta > 0 ? `+${delta}` : delta}
                                        </span>
                                    </button>
                                );
                            })}
                            <button
                                ref={effectBtnRef}
                                onClick={() => setShowPicker(!showPicker)}
                                className="transition-transform hover:scale-110"
                                title="Add Status Effect"
                            >
                                <StatusEffectIcon />
                            </button>
                            {showPicker && (
                                <StatusEffectPicker
                                    appliedEffects={combatant.statusEffects}
                                    immunities={template.immunities ?? []}
                                    onAdd={(effect: StatusEffect) =>
                                        dispatch(addStatusEffect({ instanceId: combatant.instanceId, effect }))
                                    }
                                    onClose={() => setShowPicker(false)}
                                    anchorRef={effectBtnRef}
                                />
                            )}
                        </div>
                    )}

                    {/* Row 5: Resource slots */}
                    {isCombat && combatant && (combatant.spellSlotUsage.length > 0 || combatant.rageSlotUsage.length > 0) && (
                        <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                            <SlotRow usage={combatant.spellSlotUsage} slotType="spell" instanceId={combatant.instanceId} dispatch={dispatch} />
                            <SlotRow usage={combatant.rageSlotUsage} slotType="rage" instanceId={combatant.instanceId} dispatch={dispatch} />
                        </div>
                    )}
                    {isPlayer && combatant && (combatant.spellSlotUsage.length > 0 || combatant.rageSlotUsage.length > 0) && (
                        <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                            <PlayerSlotRow usage={combatant.spellSlotUsage} slotType="spell" />
                            <PlayerSlotRow usage={combatant.rageSlotUsage} slotType="rage" />
                        </div>
                    )}
                    {isBank && (template.spell_slots?.length > 0 || template.rage_slots?.length > 0) && (
                        <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                            <BankSlotRow slots={template.spell_slots} slotType="spell" />
                            <BankSlotRow slots={template.rage_slots} slotType="rage" />
                        </div>
                    )}
                </div>

                {/* ── Floating effect labels above card (combat + player) */}
                {showsCombatData && activeEffects.length > 0 && combatant && (
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {activeEffects.map((effect) => {
                            const effectColor = STATUS_EFFECT_COLORS[effect];
                            return (
                                <div
                                    key={effect}
                                    className="group/effect relative whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold text-white cursor-default"
                                    style={{
                                        backgroundColor: `${effectColor}22`,
                                        boxShadow: `0 0 12px 4px ${effectColor}30`,
                                        textShadow: `0 0 6px ${effectColor}`,
                                    }}
                                >
                                    {effect}
                                    {isCombat && (
                                        <button
                                            onClick={() => dispatch(removeStatusEffect({ instanceId: combatant.instanceId, effect }))}
                                            className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-black/70 text-[9px] text-white/80 hover:bg-red-700 hover:text-white group-hover/effect:flex"
                                        >
                                            &times;
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }
);
