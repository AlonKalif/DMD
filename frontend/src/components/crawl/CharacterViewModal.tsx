import { CharacterTemplate, AbilityScores, SkillScores } from 'types/api';
import { API_BASE_URL } from 'config';

interface CharacterViewModalProps {
    template: CharacterTemplate;
    onClose: () => void;
}

const ABILITY_LABELS: { key: keyof AbilityScores; abbr: string; label: string }[] = [
    { key: 'strength', abbr: 'STR', label: 'Strength' },
    { key: 'dexterity', abbr: 'DEX', label: 'Dexterity' },
    { key: 'constitution', abbr: 'CON', label: 'Constitution' },
    { key: 'intelligence', abbr: 'INT', label: 'Intelligence' },
    { key: 'wisdom', abbr: 'WIS', label: 'Wisdom' },
    { key: 'charisma', abbr: 'CHA', label: 'Charisma' },
];

const SKILL_KEY_MAP: [string, keyof SkillScores][] = [
    ['Acrobatics', 'acrobatics'], ['Animal Handling', 'animal_handling'], ['Arcana', 'arcana'],
    ['Athletics', 'athletics'], ['Deception', 'deception'], ['History', 'history'],
    ['Insight', 'insight'], ['Intimidation', 'intimidation'], ['Investigation', 'investigation'],
    ['Medicine', 'medicine'], ['Nature', 'nature'], ['Perception', 'perception'],
    ['Performance', 'performance'], ['Persuasion', 'persuasion'], ['Religion', 'religion'],
    ['Sleight of Hand', 'sleight_of_hand'], ['Stealth', 'stealth'], ['Survival', 'survival'],
];

function formatModifier(mod: number): string {
    return mod >= 0 ? `+${mod}` : `${mod}`;
}

function StatRow({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex items-baseline gap-1 border-b border-tome-leather/15 py-0.5">
            <span className="text-tome-leather/60 text-sm whitespace-nowrap">{label}</span>
            <span className="text-tome-leather font-semibold text-sm">{value}</span>
        </div>
    );
}

function TaperedRule() {
    return (
        <svg className="mt-1.5 mb-1 w-full" viewBox="0 0 100 4" preserveAspectRatio="none" height="6">
            <polygon points="0,0 100,2 0,4" fill="#991b1b" />
        </svg>
    );
}

function SectionHeader({ title }: { title: string }) {
    return (
        <h3 className="font-blackletter text-sm font-bold uppercase tracking-wider text-wax-red mt-3 mb-1 border-b border-tome-leather/25 pb-0.5">{title}</h3>
    );
}

export function CharacterViewModal({ template, onClose }: CharacterViewModalProps) {
    const t = template;
    const hasAbilities = t.abilities && ABILITY_LABELS.some(a => t.abilities[a.key]?.score > 0);
    const subtitleParts = [t.race, t.class, t.size, t.creature_type, t.alignment].filter(Boolean);
    const nonZeroSkills = SKILL_KEY_MAP.filter(([, key]) => t.skills?.[key] !== 0);
    const speeds: { label: string; value: number }[] = [
        { label: 'Walk', value: t.speed },
        { label: 'Burrow', value: t.burrow_speed },
        { label: 'Climb', value: t.climb_speed },
        { label: 'Fly', value: t.fly_speed },
        { label: 'Swim', value: t.swim_speed },
    ].filter(s => s.value > 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
            {/* Outer wrapper: flex aligns sheet + portrait vertically centered */}
            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>

            {/* Stat sheet — the parchment block */}
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-parchment paper-texture parchment-edge shadow-2xl">
                <img src="/dmd_logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 m-auto w-[70%] h-[70%] object-contain opacity-[0.04]" />
                <div className="relative max-h-[90vh] overflow-y-auto no-scrollbar px-10 pt-7 pb-7">
                    {/* Header row: name + close button */}
                    <div className="flex items-start justify-between gap-2">
                        <h2 className="font-blackletter text-2xl font-bold text-tome-leather">{t.name}</h2>
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-tome-leather/20 text-tome-leather/70 hover:bg-tome-leather/40 hover:text-tome-leather transition-colors text-sm leading-none"
                        >
                            &times;
                        </button>
                    </div>
                    {/* Subtitle: level pill + traits */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="rounded-full bg-tome-leather/20 px-2.5 py-0.5 text-xs font-semibold text-tome-leather">
                            Lv {t.level}
                        </span>
                        {subtitleParts.length > 0 && (
                            <span className="text-sm italic text-tome-leather/70">{subtitleParts.join(', ')}</span>
                        )}
                    </div>
                    <TaperedRule />

                    {/* Core combat stats */}
                    <SectionHeader title="Combat" />
                    <div className="grid grid-cols-2 gap-x-3">
                        <StatRow label="Hit Points" value={`${t.hp} / ${t.max_hp}`} />
                        <StatRow label="Armor Class" value={t.ac} />
                        {t.proficiency_bonus > 0 && <StatRow label="Proficiency" value={formatModifier(t.proficiency_bonus)} />}
                        {t.hit_dice && <StatRow label="Hit Dice" value={t.hit_dice} />}
                    </div>
                    {t.spell_slots?.length > 0 && (
                        <div className="mt-1">
                            <span className="text-xs font-semibold text-blue-700">Spell Slots</span>
                            <div className="flex flex-wrap gap-2 mt-0.5">
                                {t.spell_slots.map(s => (
                                    <span key={s.level} className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800 font-medium">
                                        Lv {s.level} &times; {s.count}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {t.rage_slots?.length > 0 && (
                        <div className="mt-1">
                            <span className="text-xs font-semibold text-orange-700">Rage Slots</span>
                            <div className="flex flex-wrap gap-2 mt-0.5">
                                {t.rage_slots.map(s => (
                                    <span key={s.level} className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-800 font-medium">
                                        Lv {s.level} &times; {s.count}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Speed */}
                    {speeds.length > 0 && (
                        <>
                            <SectionHeader title="Speed" />
                            <div className="grid grid-cols-2 gap-x-3">
                                {speeds.map(s => (
                                    <StatRow key={s.label} label={s.label} value={`${s.value} ft`} />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Ability Scores */}
                    {hasAbilities && (
                        <>
                            <SectionHeader title="Ability Scores" />
                            <div className="grid grid-cols-3 gap-1.5">
                                {ABILITY_LABELS.map(({ key, abbr }) => {
                                    const a = t.abilities[key];
                                    if (!a || a.score === 0) return null;
                                    return (
                                        <div key={key} className="flex flex-col items-center rounded border border-tome-leather/20 bg-tome-leather/10 px-1 py-1">
                                            <span className="text-[9px] font-bold text-wax-red tracking-wider">{abbr}</span>
                                            <span className="text-base font-bold text-tome-leather leading-tight">{a.score}</span>
                                            <span className="text-[10px] text-tome-leather/60">{formatModifier(a.modifier)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Saving Throws — hide +0 (unset) entries */}
                    {t.saving_throws?.filter(st => st.value !== 0).length > 0 && (
                        <>
                            <SectionHeader title="Saving Throws" />
                            <div className="grid grid-cols-2 gap-x-3">
                                {t.saving_throws.filter(st => st.value !== 0).map(st => (
                                    <StatRow key={st.ability} label={st.ability} value={formatModifier(st.value)} />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Skills */}
                    {nonZeroSkills.length > 0 && (
                        <>
                            <SectionHeader title="Skills" />
                            <div className="grid grid-cols-2 gap-x-3">
                                {nonZeroSkills.map(([label, key]) => (
                                    <StatRow key={key} label={label} value={formatModifier(t.skills[key])} />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Immunities */}
                    {t.immunities?.length > 0 && (
                        <>
                            <SectionHeader title="Condition Immunities" />
                            <div className="flex flex-wrap gap-1.5">
                                {t.immunities.map(imm => (
                                    <span key={imm} className="rounded-full bg-tome-leather/15 px-2.5 py-0.5 text-xs text-tome-leather">
                                        {imm}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Damage Relations */}
                    {t.damage_relations?.length > 0 && (
                        <>
                            <SectionHeader title="Damage Relations" />
                            <div className="grid grid-cols-2 gap-x-3">
                                {t.damage_relations.map((dr, i) => (
                                    <StatRow
                                        key={i}
                                        label={dr.damage_type + (dr.custom_text ? ` (${dr.custom_text})` : '')}
                                        value={dr.relation === 'immune' ? 'Immune' : 'Vulnerable'}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Languages */}
                    {t.languages?.length > 0 && (
                        <>
                            <SectionHeader title="Languages" />
                            <div className="flex flex-wrap gap-1.5">
                                {t.languages.map((lang, i) => (
                                    <span key={i} className="rounded-full bg-tome-leather/15 px-2.5 py-0.5 text-xs text-tome-leather">
                                        {lang.language}{lang.proficiency === 'understand' ? ' (understands)' : ''}{lang.custom_text ? ` — ${lang.custom_text}` : ''}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Senses */}
                    {t.senses?.length > 0 && (
                        <>
                            <SectionHeader title="Senses" />
                            <div className="flex flex-wrap gap-1.5">
                                {t.senses.map((s, i) => (
                                    <span key={i} className="rounded-full bg-tome-leather/15 px-2.5 py-0.5 text-xs text-tome-leather">
                                        {s.sense}{s.custom_text ? ` — ${s.custom_text}` : ''}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Actions */}
                    {t.actions?.length > 0 && (
                        <>
                            <SectionHeader title="Actions" />
                            <div className="space-y-1">
                                {t.actions.map((a, i) => (
                                    <div key={i}>
                                        <p className="text-sm font-semibold text-tome-leather">{a.name}</p>
                                        <p className="text-xs text-tome-leather/70 whitespace-pre-wrap leading-snug">{a.description}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Reactions */}
                    {t.reactions?.length > 0 && (
                        <>
                            <SectionHeader title="Reactions" />
                            <div className="space-y-1">
                                {t.reactions.map((r, i) => (
                                    <div key={i}>
                                        <p className="text-sm font-semibold text-tome-leather">{r.name}</p>
                                        <p className="text-xs text-tome-leather/70 whitespace-pre-wrap leading-snug">{r.description}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Other Features */}
                    {t.other_features?.length > 0 && (
                        <>
                            <SectionHeader title="Other Features" />
                            <div className="space-y-1">
                                {t.other_features.map((f, i) => (
                                    <div key={i}>
                                        <p className="text-sm font-semibold text-tome-leather">{f.name}</p>
                                        <p className="text-xs text-tome-leather/70 whitespace-pre-wrap leading-snug">{f.description}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                </div>
            </div>

            {/* Character portrait — separate block attached to sheet's right edge */}
            {t.photo_path && (
                <div className="hidden md:block -ml-4 w-44 flex-shrink-0">
                    <div className="overflow-hidden rounded-lg border-2 border-paladin-gold/40 shadow-2xl bg-parchment">
                        <img
                            src={`${API_BASE_URL}/static/${t.photo_path}`}
                            alt={t.name}
                            className="w-full object-cover sketch-image"
                        />
                    </div>
                </div>
            )}

            </div>
        </div>
    );
}
