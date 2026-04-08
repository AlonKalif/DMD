import { useState, useEffect, useRef, useCallback, FormEvent, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { fetchImages } from 'features/images/imageSlice';
import {
    CharacterTemplate, MediaAsset, AbilityScores, SkillScores,
    SavingThrow, DamageRelation, LanguageEntry, SenseEntry, NamedEntry,
    ResourceSlot,
    SIZES, CREATURE_TYPES, CORE_ABILITIES, SKILL_NAMES,
    IMMUNITIES_LIST, DAMAGE_TYPES, LANGUAGES, SENSES,
} from 'types/api';
import { STATUS_EFFECT_COLORS } from './statusEffects';
import { API_BASE_URL } from 'config';

const TYPE_COLORS = { pc: '#2d4a3e', monster: '#5c4033' } as const;

const DEFAULT_ABILITIES: AbilityScores = {
    strength: { score: 10, modifier: 0 }, dexterity: { score: 10, modifier: 0 },
    constitution: { score: 10, modifier: 0 }, intelligence: { score: 10, modifier: 0 },
    wisdom: { score: 10, modifier: 0 }, charisma: { score: 10, modifier: 0 },
};

const DEFAULT_SKILLS: SkillScores = {
    acrobatics: 0, animal_handling: 0, arcana: 0, athletics: 0, deception: 0,
    history: 0, insight: 0, intimidation: 0, investigation: 0, medicine: 0,
    nature: 0, perception: 0, performance: 0, persuasion: 0, religion: 0,
    sleight_of_hand: 0, stealth: 0, survival: 0,
};

const SKILL_ABILITY_MAP: Record<string, string> = {
    'Acrobatics': 'DEX', 'Animal Handling': 'WIS', 'Arcana': 'INT',
    'Athletics': 'STR', 'Deception': 'CHA', 'History': 'INT',
    'Insight': 'WIS', 'Intimidation': 'CHA', 'Investigation': 'INT',
    'Medicine': 'WIS', 'Nature': 'INT', 'Perception': 'WIS',
    'Performance': 'CHA', 'Persuasion': 'CHA', 'Religion': 'INT',
    'Sleight of Hand': 'DEX', 'Stealth': 'DEX', 'Survival': 'WIS',
};

const SKILL_KEY_MAP: [string, keyof SkillScores][] = SKILL_NAMES.map((label) => [
    label,
    label.toLowerCase().replace(/ /g, '_') as keyof SkillScores,
]);

const ABILITY_KEYS: (keyof AbilityScores)[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

const IMMUNITY_COLOR_MAP: Record<string, string> = Object.fromEntries(
    IMMUNITIES_LIST.map((imm) => [imm, (STATUS_EFFECT_COLORS as Record<string, string>)[imm] ?? '#6b7280'])
);

// ── Reusable sub-components ────────────────────────────────────────────

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-t border-paladin-gold/15 pt-2">
            <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-1 text-sm font-semibold text-paladin-gold/80 hover:text-paladin-gold transition-colors">
                <span>{title}</span>
                <span className="text-xs">{open ? '▾' : '▸'}</span>
            </button>
            {open && <div className="mt-2 space-y-3">{children}</div>}
        </div>
    );
}

function Stepper({ label, value, onChange, min = 0, step = 1 }: { label: string; value: number; onChange: (v: number) => void; min?: number; step?: number }) {
    return (
        <div>
            <label className="mb-1 block text-xs font-medium text-parchment/70">{label}</label>
            <div className="flex items-center rounded-md border border-paladin-gold/30 bg-leather-dark">
                <button type="button" onClick={() => onChange(Math.max(min, value - step))} className="px-2 py-1.5 text-sm font-bold text-paladin-gold/70 hover:text-paladin-gold transition-colors">&#8722;</button>
                <input type="number" min={min} step={step} value={value} onChange={(e) => onChange(Math.max(min, Number(e.target.value)))} className="hide-spin w-full bg-transparent p-1 text-center text-parchment focus:outline-none text-sm" />
                <button type="button" onClick={() => onChange(value + step)} className="px-2 py-1.5 text-sm font-bold text-paladin-gold/70 hover:text-paladin-gold transition-colors">+</button>
            </div>
        </div>
    );
}

function MiniStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex items-center rounded border border-paladin-gold/30 bg-leather-dark">
            <button type="button" onClick={() => onChange(value - 1)} className="px-1.5 py-0.5 text-xs font-bold text-paladin-gold/70 hover:text-paladin-gold transition-colors">&#8722;</button>
            <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="hide-spin w-10 bg-transparent py-0.5 text-center text-xs text-parchment focus:outline-none" />
            <button type="button" onClick={() => onChange(value + 1)} className="px-1.5 py-0.5 text-xs font-bold text-paladin-gold/70 hover:text-paladin-gold transition-colors">+</button>
        </div>
    );
}

function ImagePickerStrip({ images, selectedImagePath, onSelect }: { images: MediaAsset[]; selectedImagePath: string; onSelect: (a: MediaAsset) => void }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const scroll = (dir: number) => { scrollRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' }); };

    if (images.length === 0) return <p className="text-center text-sm text-faded-ink py-4">No images available.</p>;

    return (
        <div className="relative rounded-md border border-paladin-gold/30 bg-leather-dark">
            <button type="button" onClick={() => scroll(-1)} className="absolute left-0 top-0 bottom-0 z-10 flex w-7 items-center justify-center bg-gradient-to-r from-leather-dark via-leather-dark/90 to-transparent text-paladin-gold/70 hover:text-paladin-gold transition-colors">
                &#9664;
            </button>
            <div ref={scrollRef} className="flex gap-2 overflow-x-scroll px-8 py-2 no-scrollbar">
                {images.map((img) => (
                    <button key={img.ID} type="button" onClick={() => onSelect(img)} className={`flex-shrink-0 overflow-hidden rounded-md border-2 transition-transform hover:scale-105 ${selectedImagePath === img.file_path ? 'border-arcane-purple' : 'border-transparent'}`}>
                        <img src={`${API_BASE_URL}/static/${img.file_path}`} alt={img.name} className="h-20 w-20 object-cover" />
                    </button>
                ))}
            </div>
            <button type="button" onClick={() => scroll(1)} className="absolute right-0 top-0 bottom-0 z-10 flex w-7 items-center justify-center bg-gradient-to-l from-leather-dark via-leather-dark/90 to-transparent text-paladin-gold/70 hover:text-paladin-gold transition-colors">
                &#9654;
            </button>
        </div>
    );
}

function SlotPreviewIcon({ level, type }: { level: number; type: 'spell' | 'rage' }) {
    if (type === 'spell') {
        return (
            <div className="relative">
                <svg width="32" height="32" viewBox="-1 -1 26 26" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-300" style={{ filter: 'drop-shadow(0 0 5px rgba(96,165,250,0.9))' }}>
                    <path d="M12 2l2 7h7l-6 4 2 8-5-5-5 5 2-8-6-4h7l2-7z" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center pt-[2px] text-[11px] font-extrabold text-white" style={{ WebkitTextStroke: '2px #0c4a6e', paintOrder: 'stroke fill' } as any}>{level}</span>
            </div>
        );
    }
    return (
        <div className="relative">
            <svg width="32" height="32" viewBox="-1 -1 26 26" fill="currentColor" className="text-orange-400" style={{ filter: 'drop-shadow(0 0 5px rgba(249,115,22,0.9))' }}>
                <path d="M12 2c0 0-4 4.5-4 9.5s3.5 8.5 8 8.5c-1.5-1-2.5-3-2.5-5 0-3.5 4.5-6.5 4.5-6.5C18 12 15 16 15 16s-2-2-2-4 2.5-4 2.5-4C13 8 12 2 12 2z" />
                <path d="M8 12c0 0-2 2-2 5s2 5 5 5c-1-1-1.5-2.5-1.5-4 0-2 2.5-4 2.5-4s-1-2-4-2z" fill="#000" fillOpacity="0.2" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center pt-[2px] text-[11px] font-extrabold text-white" style={{ WebkitTextStroke: '2px #5c2200', paintOrder: 'stroke fill' } as any}>{level}</span>
        </div>
    );
}

function SlotEditor({ label, slots, onChange, slotType }: { label: string; slots: ResourceSlot[]; onChange: (s: ResourceSlot[]) => void; slotType: 'spell' | 'rage' }) {
    const addLevel = () => {
        const nextLevel = slots.length > 0 ? Math.max(...slots.map(s => s.level)) + 1 : 1;
        onChange([...slots, { level: nextLevel, count: 1 }]);
    };
    const remove = (i: number) => onChange(slots.filter((_, j) => j !== i));
    const update = (i: number, field: 'level' | 'count', val: number) => {
        const next = [...slots];
        next[i] = { ...next[i], [field]: Math.max(field === 'level' ? 1 : 0, val) };
        onChange(next);
    };
    return (
        <div>
            <label className="mb-1 block text-xs font-medium text-parchment/70">{label}</label>
            {slots.map((slot, i) => (
                <div key={i} className="mb-2 rounded-md border border-paladin-gold/15 bg-obsidian/20 p-2">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] text-parchment/50">Lv</span>
                            <input type="number" min={1} value={slot.level} onChange={(e) => update(i, 'level', Number(e.target.value))} className="hide-spin w-10 rounded border border-paladin-gold/30 bg-leather-dark px-1.5 py-0.5 text-center text-xs text-parchment focus:outline-none" />
                        </div>
                        <div className="flex items-center gap-1">
                            <button type="button" onClick={() => update(i, 'count', slot.count - 1)} className="flex h-5 w-5 items-center justify-center rounded bg-paladin-gold/20 text-xs font-bold text-parchment/70 hover:bg-paladin-gold/40">&#8722;</button>
                            <span className="text-xs text-parchment w-4 text-center">{slot.count}</span>
                            <button type="button" onClick={() => update(i, 'count', slot.count + 1)} className="flex h-5 w-5 items-center justify-center rounded bg-paladin-gold/20 text-xs font-bold text-parchment/70 hover:bg-paladin-gold/40">+</button>
                        </div>
                        <button type="button" onClick={() => remove(i)} className="ml-auto shrink-0 rounded bg-wax-red/40 px-1.5 py-0.5 text-[10px] text-parchment hover:bg-wax-red/60">&#10005;</button>
                    </div>
                    <div className="flex flex-wrap gap-0.5">
                        {Array.from({ length: slot.count }).map((_, si) => (
                            <SlotPreviewIcon key={si} level={slot.level} type={slotType} />
                        ))}
                    </div>
                </div>
            ))}
            <button type="button" onClick={addLevel} className="mt-1 rounded-md bg-arcane-purple/30 px-3 py-1 text-xs text-parchment hover:bg-arcane-purple/50 transition-colors">+ Add Level</button>
        </div>
    );
}

const INPUT_CLS = 'w-full rounded-md border border-paladin-gold/30 bg-leather-dark p-2 text-sm text-parchment placeholder-faded-ink focus:border-arcane-purple focus:ring-arcane-purple';
const SELECT_CLS = 'w-full rounded-md border border-paladin-gold/30 bg-leather-dark p-2 text-sm text-parchment focus:border-arcane-purple focus:ring-arcane-purple';
const PILL_BASE = 'rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer select-none';
const ADD_BTN = 'mt-1 rounded-md bg-arcane-purple/30 px-3 py-1 text-xs text-parchment hover:bg-arcane-purple/50 transition-colors';
const REMOVE_BTN = 'ml-1 shrink-0 rounded bg-wax-red/40 px-1.5 py-0.5 text-[10px] text-parchment hover:bg-wax-red/60';

// ── Main component ─────────────────────────────────────────────────────

interface TemplateFormModalProps {
    initial?: CharacterTemplate;
    characterType: 'pc' | 'monster';
    onSave: (data: Omit<CharacterTemplate, 'ID'>) => void;
    onClose: () => void;
}

export function TemplateFormModal({ initial, characterType, onSave, onClose }: TemplateFormModalProps) {
    const dispatch = useAppDispatch();
    const images = useAppSelector((state) => state.images.items);
    const imagesStatus = useAppSelector((state) => state.images.status);

    // Basic info
    const [name, setName] = useState(initial?.name ?? '');
    const [race, setRace] = useState(initial?.race ?? '');
    const [charClass, setCharClass] = useState(initial?.class ?? '');
    const [alignment, setAlignment] = useState(initial?.alignment ?? '');
    const [size, setSize] = useState(initial?.size ?? '');
    const [creatureType, setCreatureType] = useState(initial?.creature_type ?? '');
    const [creatureTypeCustom, setCreatureTypeCustom] = useState(initial?.creature_type_custom ?? '');

    // Combat stats
    const [level, setLevel] = useState(initial?.level ?? 1);
    const [maxHp, setMaxHp] = useState(initial?.max_hp ?? 10);
    const [ac, setAc] = useState(initial?.ac ?? 10);
    const [profBonus, setProfBonus] = useState(initial?.proficiency_bonus ?? 0);
    const [hitDice, setHitDice] = useState(initial?.hit_dice ?? '');
    const [spellSlots, setSpellSlots] = useState<ResourceSlot[]>(initial?.spell_slots ?? []);
    const [rageSlots, setRageSlots] = useState<ResourceSlot[]>(initial?.rage_slots ?? []);
    const [speed, setSpeed] = useState(initial?.speed ?? 0);

    // Speeds (special)
    const [burrowSpeed, setBurrowSpeed] = useState(initial?.burrow_speed ?? 0);
    const [climbSpeed, setClimbSpeed] = useState(initial?.climb_speed ?? 0);
    const [flySpeed, setFlySpeed] = useState(initial?.fly_speed ?? 0);
    const [swimSpeed, setSwimSpeed] = useState(initial?.swim_speed ?? 0);

    // Abilities
    const [abilities, setAbilities] = useState<AbilityScores>(initial?.abilities ?? { ...DEFAULT_ABILITIES });

    // Skills
    const [skills, setSkills] = useState<SkillScores>(initial?.skills ?? { ...DEFAULT_SKILLS });

    // Saving throws
    const [savingThrows, setSavingThrows] = useState<SavingThrow[]>(initial?.saving_throws ?? []);

    // Immunities
    const [immunities, setImmunities] = useState<string[]>(initial?.immunities ?? []);

    // Damage relations
    const [damageRelations, setDamageRelations] = useState<DamageRelation[]>(initial?.damage_relations ?? []);

    // Languages
    const [languages, setLanguages] = useState<LanguageEntry[]>(initial?.languages ?? []);

    // Senses
    const [senses, setSenses] = useState<SenseEntry[]>(initial?.senses ?? []);

    // Actions, Reactions, Features
    const [actions, setActions] = useState<NamedEntry[]>(initial?.actions ?? []);
    const [reactions, setReactions] = useState<NamedEntry[]>(initial?.reactions ?? []);
    const [otherFeatures, setOtherFeatures] = useState<NamedEntry[]>(initial?.other_features ?? []);

    // Photo
    const [selectedImagePath, setSelectedImagePath] = useState(initial?.photo_path ?? '');
    const [photoOffsetY, setPhotoOffsetY] = useState(initial?.photo_offset_y ?? 50);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (imagesStatus === 'idle') dispatch(fetchImages());
    }, [imagesStatus, dispatch]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            await onSave({
                name: name.trim(), race: race.trim(), class: charClass.trim(),
                alignment: alignment.trim(), size, creature_type: creatureType,
                creature_type_custom: creatureTypeCustom.trim(),
                level, hp: maxHp, max_hp: maxHp, ac,
                proficiency_bonus: profBonus, hit_dice: hitDice.trim(),
                spell_slots: spellSlots, rage_slots: rageSlots,
                speed, burrow_speed: burrowSpeed, climb_speed: climbSpeed,
                fly_speed: flySpeed, swim_speed: swimSpeed,
                abilities, saving_throws: savingThrows, skills,
                immunities, damage_relations: damageRelations,
                languages, senses, actions, reactions, other_features: otherFeatures,
                color: TYPE_COLORS[characterType], character_type: characterType,
                photo_path: selectedImagePath,
                photo_offset_y: photoOffsetY,
                custom_fields: initial?.custom_fields ?? null,
            });
        } finally { setIsSaving(false); }
    };

    const handleSelectImage = (asset: MediaAsset) => { setSelectedImagePath(asset.file_path); setPhotoOffsetY(50); setShowImagePicker(false); };

    // Drag-to-adjust image offset in card preview
    const previewRef = useRef<HTMLDivElement>(null);
    const dragState = useRef<{ startY: number; startOffset: number } | null>(null);

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        dragState.current = { startY: e.clientY, startOffset: photoOffsetY };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [photoOffsetY]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragState.current || !previewRef.current) return;
        const dy = e.clientY - dragState.current.startY;
        const h = previewRef.current.clientHeight;
        const delta = (dy / h) * -200;
        setPhotoOffsetY(Math.round(Math.max(0, Math.min(100, dragState.current.startOffset + delta))));
    }, []);

    const onPointerUp = useCallback(() => { dragState.current = null; }, []);

    const setAbility = (key: keyof AbilityScores, field: 'score' | 'modifier', val: number) => {
        setAbilities((prev) => ({ ...prev, [key]: { ...prev[key], [field]: Math.max(0, val) } }));
    };

    const setSkill = (key: keyof SkillScores, val: number) => {
        setSkills((prev) => ({ ...prev, [key]: Math.max(0, val) }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
            <form
                onSubmit={handleSubmit}
                className="leather-card relative flex w-full max-w-2xl flex-col rounded-lg text-parchment max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="filigree-corner filigree-tl" />
                <div className="filigree-corner filigree-tr" />
                <div className="filigree-corner filigree-bl" />
                <div className="filigree-corner filigree-br" />
                <div className="flex flex-col space-y-4 overflow-y-auto fantasy-scrollbar p-6">

                {/* ── Header ─────────────────────────────────────── */}
                <h2 className="text-xl font-bold font-blackletter gold-gradient-text">
                    {initial ? 'Edit' : 'New'} {characterType === 'pc' ? 'Player Character' : 'Monster'}
                </h2>

                {/* ── Basic Info + Card Preview (always visible) ────────── */}
                <div className="flex gap-4">
                    {/* Card preview on the left */}
                    <div className="flex flex-col items-center gap-1.5">
                        {/* Matches CharacterCard: w-40 image area is h-32 (ratio 5:4) */}
                        <div
                            ref={previewRef}
                            className="relative w-32 aspect-[5/4] flex-shrink-0 overflow-hidden rounded-lg border-2 border-paladin-gold/60 cursor-ns-resize select-none"
                            style={{ backgroundColor: TYPE_COLORS[characterType] }}
                            onPointerDown={selectedImagePath ? onPointerDown : undefined}
                            onPointerMove={selectedImagePath ? onPointerMove : undefined}
                            onPointerUp={selectedImagePath ? onPointerUp : undefined}
                        >
                            {selectedImagePath ? (
                                <>
                                    <img
                                        src={`${API_BASE_URL}/static/${selectedImagePath}`}
                                        alt="Preview"
                                        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                                        style={{ objectPosition: `center ${photoOffsetY}%` }}
                                        draggable={false}
                                    />
                                    <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to bottom, transparent 40%, ${TYPE_COLORS[characterType]})` }} />
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setSelectedImagePath(''); }}
                                        className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-400"
                                    >&times;</button>
                                </>
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <img src="/dmd_logo.png" alt="" className="h-3/4 w-3/4 object-contain opacity-20" />
                                </div>
                            )}
                        </div>
                        <button type="button" onClick={() => setShowImagePicker(!showImagePicker)} className="rounded-md bg-faded-ink/40 px-2 py-1 text-xs text-parchment hover:bg-faded-ink/60">
                            {selectedImagePath ? 'Change' : 'Choose'}
                        </button>
                        {selectedImagePath && (
                            <p className="text-[10px] text-parchment/40">Drag to adjust</p>
                        )}
                    </div>

                    {/* Name, Race, Class */}
                    <div className="flex-1 space-y-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-parchment/70">Name *</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus className={INPUT_CLS} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-parchment/70">Race</label>
                                <input type="text" value={race} onChange={(e) => setRace(e.target.value)} placeholder="e.g. Half-Elf" className={INPUT_CLS} />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-parchment/70">Class</label>
                                <input type="text" value={charClass} onChange={(e) => setCharClass(e.target.value)} placeholder="e.g. Ranger" className={INPUT_CLS} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Image picker strip */}
                {showImagePicker && (
                    <ImagePickerStrip
                        images={images}
                        selectedImagePath={selectedImagePath}
                        onSelect={handleSelectImage}
                    />
                )}

                {/* Alignment, Size, Creature Type */}
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-parchment/70">Alignment</label>
                        <input type="text" value={alignment} onChange={(e) => setAlignment(e.target.value)} placeholder="e.g. Chaotic Good" className={INPUT_CLS} />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-parchment/70">Size</label>
                        <select value={size} onChange={(e) => setSize(e.target.value)} className={SELECT_CLS}>
                            <option value="">—</option>
                            {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-parchment/70">Creature Type</label>
                        <select value={creatureType} onChange={(e) => setCreatureType(e.target.value)} className={SELECT_CLS}>
                            <option value="">—</option>
                            {CREATURE_TYPES.map((ct) => <option key={ct} value={ct}>{ct}</option>)}
                        </select>
                    </div>
                </div>

                {creatureType === 'Other' && (
                    <div>
                        <label className="mb-1 block text-xs font-medium text-parchment/70">Creature Type (specify)</label>
                        <input type="text" value={creatureTypeCustom} onChange={(e) => setCreatureTypeCustom(e.target.value)} placeholder="e.g. swarm of Tiny beasts" className={INPUT_CLS} />
                    </div>
                )}

                {/* ── 1. Combat Stats ─────────────────────────────── */}
                <Section title="Combat Stats" defaultOpen>
                    <div className="grid grid-cols-4 gap-3">
                        <Stepper label="Level" value={level} onChange={setLevel} />
                        <Stepper label="Max HP" value={maxHp} onChange={setMaxHp} />
                        <Stepper label="AC" value={ac} onChange={setAc} />
                        <Stepper label="Speed (ft)" value={speed} onChange={setSpeed} step={10} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Stepper label="Proficiency Bonus" value={profBonus} onChange={setProfBonus} />
                        <div>
                            <label className="mb-1 block text-xs font-medium text-parchment/70">Hit Dice</label>
                            <input type="text" value={hitDice} onChange={(e) => setHitDice(e.target.value)} placeholder="e.g. 2d6+5" className={INPUT_CLS} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <SlotEditor label="Spell Slots" slots={spellSlots} onChange={setSpellSlots} slotType="spell" />
                        <SlotEditor label="Rage Slots" slots={rageSlots} onChange={setRageSlots} slotType="rage" />
                    </div>
                </Section>

                {/* ── 2. Core Abilities ───────────────────────────── */}
                <Section title="Core Abilities">
                    <div className="grid grid-cols-3 gap-3">
                        {ABILITY_KEYS.map((key) => (
                            <div key={key} className="rounded-md border border-paladin-gold/20 bg-leather-dark p-2">
                                <p className="mb-1.5 text-center text-xs font-semibold text-paladin-gold/80 capitalize">{key}</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-center text-[10px] text-parchment/50">Score</label>
                                        <MiniStepper value={abilities[key].score} onChange={(v) => setAbility(key, 'score', v)} />
                                    </div>
                                    <div>
                                        <label className="block text-center text-[10px] text-parchment/50">Modifier</label>
                                        <MiniStepper value={abilities[key].modifier} onChange={(v) => setAbility(key, 'modifier', v)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* ── 3. Skills ───────────────────────────────────── */}
                <Section title="Skills">
                    <div className="flex">
                        {[0, 1, 2].map((col) => (
                            <div key={col} className={`flex-1 space-y-3 px-3 ${col < 2 ? 'border-r border-paladin-gold/15' : ''}`}>
                                {SKILL_KEY_MAP.filter((_, idx) => idx % 3 === col).map(([label, key]) => (
                                    <div key={key} className="flex items-center gap-1.5">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-parchment/70 truncate leading-tight" title={label}>{label}</p>
                                            <p className="text-[9px] text-parchment/30 leading-tight">{SKILL_ABILITY_MAP[label]}</p>
                                        </div>
                                        <MiniStepper value={skills[key]} onChange={(v) => setSkill(key, v)} />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </Section>

                {/* ── 4. Speeds ───────────────────────────────────── */}
                <Section title="Speeds (ft)">
                    <div className="grid grid-cols-4 gap-3">
                        <Stepper label="Burrow" value={burrowSpeed} onChange={setBurrowSpeed} step={10} />
                        <Stepper label="Climb" value={climbSpeed} onChange={setClimbSpeed} step={10} />
                        <Stepper label="Fly" value={flySpeed} onChange={setFlySpeed} step={10} />
                        <Stepper label="Swim" value={swimSpeed} onChange={setSwimSpeed} step={10} />
                    </div>
                </Section>

                {/* ── 5. Actions ──────────────────────────────────── */}
                <Section title="Actions">
                    <NamedEntryList entries={actions} onChange={setActions} addLabel="+ Add Action" />
                </Section>

                {/* ── 6. Reactions ────────────────────────────────── */}
                <Section title="Reactions">
                    <NamedEntryList entries={reactions} onChange={setReactions} addLabel="+ Add Reaction" />
                </Section>

                {/* ── 7. Saving Throws ────────────────────────────── */}
                <Section title="Saving Throws">
                    {savingThrows.map((st, i) => (
                        <div key={i} className="flex items-end gap-2">
                            <div className="flex-1">
                                <select value={st.ability} onChange={(e) => { const next = [...savingThrows]; next[i] = { ...st, ability: e.target.value }; setSavingThrows(next); }} className={SELECT_CLS}>
                                    <option value="">Ability</option>
                                    {CORE_ABILITIES.map((a) => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <MiniStepper value={st.value} onChange={(v) => { const next = [...savingThrows]; next[i] = { ...st, value: Math.max(0, v) }; setSavingThrows(next); }} />
                            <button type="button" onClick={() => setSavingThrows(savingThrows.filter((_, j) => j !== i))} className={REMOVE_BTN}>&#10005;</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => setSavingThrows([...savingThrows, { ability: '', value: 0 }])} className={ADD_BTN}>+ Add Saving Throw</button>
                </Section>

                {/* ── 8. Languages ────────────────────────────────── */}
                <Section title="Languages">
                    {languages.map((lang, i) => (
                        <div key={i} className="flex items-end gap-2">
                            <div className="flex-1">
                                <select value={lang.language} onChange={(e) => { const next = [...languages]; next[i] = { ...lang, language: e.target.value }; setLanguages(next); }} className={SELECT_CLS}>
                                    <option value="">Language</option>
                                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div className="w-28">
                                <select value={lang.proficiency} onChange={(e) => { const next = [...languages]; next[i] = { ...lang, proficiency: e.target.value as LanguageEntry['proficiency'] }; setLanguages(next); }} className={SELECT_CLS}>
                                    <option value="speak">Speaks</option>
                                    <option value="understand">Understands</option>
                                </select>
                            </div>
                            {lang.language === 'Other' && (
                                <div className="w-32">
                                    <input type="text" value={lang.custom_text ?? ''} onChange={(e) => { const next = [...languages]; next[i] = { ...lang, custom_text: e.target.value }; setLanguages(next); }} placeholder="Specify..." className={INPUT_CLS} />
                                </div>
                            )}
                            <button type="button" onClick={() => setLanguages(languages.filter((_, j) => j !== i))} className={REMOVE_BTN}>&#10005;</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => setLanguages([...languages, { language: '', proficiency: 'speak' }])} className={ADD_BTN}>+ Add Language</button>
                </Section>

                {/* ── 9. Senses ───────────────────────────────────── */}
                <Section title="Senses">
                    {senses.map((s, i) => (
                        <div key={i} className="flex items-end gap-2">
                            <div className="flex-1">
                                <select value={s.sense} onChange={(e) => { const next = [...senses]; next[i] = { ...s, sense: e.target.value }; setSenses(next); }} className={SELECT_CLS}>
                                    <option value="">Sense</option>
                                    {SENSES.map((se) => <option key={se} value={se}>{se}</option>)}
                                </select>
                            </div>
                            {s.sense === 'Other' && (
                                <div className="flex-1">
                                    <input type="text" value={s.custom_text ?? ''} onChange={(e) => { const next = [...senses]; next[i] = { ...s, custom_text: e.target.value }; setSenses(next); }} placeholder="Specify..." className={INPUT_CLS} />
                                </div>
                            )}
                            <button type="button" onClick={() => setSenses(senses.filter((_, j) => j !== i))} className={REMOVE_BTN}>&#10005;</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => setSenses([...senses, { sense: '' }])} className={ADD_BTN}>+ Add Sense</button>
                </Section>

                {/* ── 10. Condition Immunities ────────────────────── */}
                <Section title="Condition Immunities">
                    <div className="flex flex-wrap gap-2">
                        {IMMUNITIES_LIST.map((imm) => {
                            const active = immunities.includes(imm);
                            const color = IMMUNITY_COLOR_MAP[imm];
                            return (
                                <button
                                    key={imm} type="button"
                                    onClick={() => setImmunities(active ? immunities.filter((i) => i !== imm) : [...immunities, imm])}
                                    className={`${PILL_BASE} ${active ? 'text-white' : 'bg-faded-ink/30 text-parchment/60 hover:bg-faded-ink/50'}`}
                                    style={active ? { backgroundColor: color, boxShadow: `0 0 8px ${color}66` } : undefined}
                                >{imm}</button>
                            );
                        })}
                    </div>
                </Section>

                {/* ── 11. Damage Immunities & Vulnerabilities ────── */}
                <Section title="Damage Immunities & Vulnerabilities">
                    {damageRelations.map((dr, i) => (
                        <div key={i} className="flex items-end gap-2">
                            <div className="flex-1">
                                <select value={dr.damage_type} onChange={(e) => { const next = [...damageRelations]; next[i] = { ...dr, damage_type: e.target.value }; setDamageRelations(next); }} className={SELECT_CLS}>
                                    <option value="">Damage Type</option>
                                    {DAMAGE_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="w-28">
                                <select value={dr.relation} onChange={(e) => { const next = [...damageRelations]; next[i] = { ...dr, relation: e.target.value as 'immune' | 'vulnerable' }; setDamageRelations(next); }} className={SELECT_CLS}>
                                    <option value="immune">Immune</option>
                                    <option value="vulnerable">Vulnerable</option>
                                </select>
                            </div>
                            {dr.damage_type === 'Other' && (
                                <div className="w-32">
                                    <input type="text" value={dr.custom_text ?? ''} onChange={(e) => { const next = [...damageRelations]; next[i] = { ...dr, custom_text: e.target.value }; setDamageRelations(next); }} placeholder="Specify..." className={INPUT_CLS} />
                                </div>
                            )}
                            <button type="button" onClick={() => setDamageRelations(damageRelations.filter((_, j) => j !== i))} className={REMOVE_BTN}>&#10005;</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => setDamageRelations([...damageRelations, { damage_type: '', relation: 'immune' }])} className={ADD_BTN}>+ Add Damage Relation</button>
                </Section>

                {/* ── 12. Other Features ──────────────────────────── */}
                <Section title="Other Features">
                    <NamedEntryList entries={otherFeatures} onChange={setOtherFeatures} addLabel="+ Add Feature" />
                </Section>

                {/* ── Form actions ────────────────────────────────── */}
                <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={onClose} className="rounded-md bg-faded-ink/40 px-4 py-2 text-parchment hover:bg-faded-ink/60">Cancel</button>
                    <button type="submit" disabled={isSaving || !name.trim()} className="rounded-md bg-arcane-purple px-4 py-2 text-parchment font-semibold hover:bg-arcane-purple/80 disabled:opacity-50 arcane-glow-hover border border-transparent">
                        {isSaving ? 'Saving...' : initial ? 'Update' : 'Create'}
                    </button>
                </div>

                </div>
            </form>
        </div>
    );
}

// ── NamedEntryList (Actions / Reactions / Features) ────────────────────

function NamedEntryList({ entries, onChange, addLabel }: { entries: NamedEntry[]; onChange: (v: NamedEntry[]) => void; addLabel: string }) {
    return (
        <>
            {entries.map((entry, i) => (
                <div key={i} className="space-y-1 rounded-md border border-paladin-gold/20 bg-obsidian/30 p-2">
                    <div className="flex items-center gap-2">
                        <input type="text" value={entry.name} onChange={(e) => { const next = [...entries]; next[i] = { ...entry, name: e.target.value }; onChange(next); }} placeholder="Name" className={INPUT_CLS} />
                        <button type="button" onClick={() => onChange(entries.filter((_, j) => j !== i))} className={REMOVE_BTN}>&#10005;</button>
                    </div>
                    <textarea value={entry.description} onChange={(e) => { const next = [...entries]; next[i] = { ...entry, description: e.target.value }; onChange(next); }} placeholder="Description" rows={2} className={`${INPUT_CLS} resize-none`} />
                </div>
            ))}
            <button type="button" onClick={() => onChange([...entries, { name: '', description: '' }])} className={ADD_BTN}>{addLabel}</button>
        </>
    );
}
