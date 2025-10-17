// File: /src/types/api.ts

// This file will hold the TypeScript definitions for our backend API models.

export interface MediaAsset {
    ID: number;
    name: string;
    type: string;
    file_path: string;
}

// We can add other types like Character, NPC, etc. here later.