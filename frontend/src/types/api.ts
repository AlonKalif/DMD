// File: /src/types/api.ts

// This file will hold the TypeScript definitions for our backend API models.

export interface MediaAsset {
    ID: number;
    name: string;
    type: string;
    file_path: string;
}

export interface PresetLayoutSlot {
    ID: number;
    image_id: number;
    slot_id: number;
    zoom: number;
    image: MediaAsset;
}

export interface PresetLayout {
    ID: number;
    layout_type: 'single' | 'dual' | 'quad';
    slots?: PresetLayoutSlot[];
}

// ── Character sheet sub-types ──────────────────────────────────────────

export interface AbilityScore {
    score: number;
    modifier: number;
}

export interface AbilityScores {
    strength: AbilityScore;
    dexterity: AbilityScore;
    constitution: AbilityScore;
    intelligence: AbilityScore;
    wisdom: AbilityScore;
    charisma: AbilityScore;
}

export interface SkillScores {
    acrobatics: number;
    animal_handling: number;
    arcana: number;
    athletics: number;
    deception: number;
    history: number;
    insight: number;
    intimidation: number;
    investigation: number;
    medicine: number;
    nature: number;
    perception: number;
    performance: number;
    persuasion: number;
    religion: number;
    sleight_of_hand: number;
    stealth: number;
    survival: number;
}

export interface SavingThrow {
    ability: string;
    value: number;
}

export interface DamageRelation {
    damage_type: string;
    relation: 'immune' | 'vulnerable';
    custom_text?: string;
}

export interface LanguageEntry {
    language: string;
    proficiency: 'understand' | 'speak';
    custom_text?: string;
}

export interface SenseEntry {
    sense: string;
    custom_text?: string;
}

export interface NamedEntry {
    name: string;
    description: string;
}

// ── Character template ─────────────────────────────────────────────────

export const SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'] as const;
export type Size = typeof SIZES[number];

export const CREATURE_TYPES = [
    'Humanoid', 'Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon',
    'Elemental', 'Fey', 'Fiend', 'Giant', 'Monstrosity', 'Ooze', 'Plant',
    'Undead', 'Other',
] as const;
export type CreatureType = typeof CREATURE_TYPES[number];

export const CORE_ABILITIES = [
    'Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma',
] as const;
export type CoreAbility = typeof CORE_ABILITIES[number];

export const SKILL_NAMES = [
    'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History',
    'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception',
    'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival',
] as const;

export const IMMUNITIES_LIST = [
    'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated',
    'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained',
    'Stunned', 'Unconscious',
] as const;

export const DAMAGE_TYPES = [
    'Acid', 'Bludgeoning', 'Cold', 'Fire', 'Force', 'Lightning', 'Necrotic',
    'Piercing', 'Poison', 'Psychic', 'Radiant', 'Slashing', 'Thunder',
    'Nonmagical Attack', 'Non-silvered Attack', 'Other',
] as const;

export const LANGUAGES = [
    'Common', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish', 'Goblin', 'Halfling',
    'Orc', 'Abyssal', 'Celestial', 'Draconic', 'Deep Speech', 'Infernal',
    'Primordial', 'Sylvan', 'Undercommon', 'Terran', 'Aquan', 'Other',
] as const;

export const SENSES = [
    'Blindsight', 'Darkvision', 'Tremorsense', 'Truesight', 'Other',
] as const;

export interface CharacterTemplate {
    ID: number;
    name: string;
    character_type: 'pc' | 'monster';
    creature_type: string;
    creature_type_custom: string;
    race: string;
    class: string;
    alignment: string;
    size: string;
    photo_path: string;
    color: string;
    level: number;
    hp: number;
    max_hp: number;
    ac: number;
    proficiency_bonus: number;
    hit_dice: string;
    spell_slots: number;
    rage_slots: number;
    speed: number;
    burrow_speed: number;
    climb_speed: number;
    fly_speed: number;
    swim_speed: number;
    abilities: AbilityScores;
    saving_throws: SavingThrow[];
    skills: SkillScores;
    immunities: string[];
    damage_relations: DamageRelation[];
    languages: LanguageEntry[];
    senses: SenseEntry[];
    actions: NamedEntry[];
    reactions: NamedEntry[];
    other_features: NamedEntry[];
    custom_fields: Record<string, unknown> | null;
}

// ── Status effects & Combatant ─────────────────────────────────────────

export const STATUS_EFFECTS = [
    'Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened',
    'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified',
    'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious',
] as const;

export type StatusEffect = typeof STATUS_EFFECTS[number];

export interface Combatant {
    instanceId: string;
    templateId: number;
    initiative: number;
    hp: number;
    max_hp: number;
    ac: number;
    statusEffects: StatusEffect[];
    isDead: boolean;
    isInDeathSave: boolean;
    deathSaveCount: number;
    copyIndex: number;
}
