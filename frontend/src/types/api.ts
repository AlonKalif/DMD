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

// We can add other types like Character, NPC, etc. here later.