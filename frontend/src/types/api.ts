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

export interface CharacterTemplate {
    ID: number;
    name: string;
    race: string;
    class: string;
    photo_path: string;
    level: number;
    hp: number;
    max_hp: number;
    ac: number;
    color: string;
    custom_fields: Record<string, unknown> | null;
}

export const STATUS_EFFECTS = [
    'Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened',
    'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified',
    'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious',
] as const;

export type StatusEffect = typeof STATUS_EFFECTS[number];

export interface Combatant {
    instanceId: string;
    templateId: number;
    name: string;
    race: string;
    class: string;
    photo_path: string;
    level: number;
    hp: number;
    max_hp: number;
    ac: number;
    color: string;
    initiative: number;
    statusEffects: StatusEffect[];
    isDead: boolean;
}