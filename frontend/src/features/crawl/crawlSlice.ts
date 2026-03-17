import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { CharacterTemplate, Combatant, StatusEffect } from 'types/api';
import { API_BASE_URL } from 'config';

interface CrawlState {
    templates: CharacterTemplate[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    searchQuery: string;
    combatants: Combatant[];
    activeTurnIndex: number;
    round: number;
}

const initialState: CrawlState = {
    templates: [],
    status: 'idle',
    error: null,
    searchQuery: '',
    combatants: [],
    activeTurnIndex: -1,
    round: 0,
};

export const fetchTemplates = createAsyncThunk(
    'crawl/fetchTemplates',
    async () => {
        const response = await axios.get<CharacterTemplate[]>(
            `${API_BASE_URL}/api/v1/crawl/templates`
        );
        return response.data;
    }
);

export const createTemplate = createAsyncThunk(
    'crawl/createTemplate',
    async (template: Omit<CharacterTemplate, 'ID'>) => {
        const response = await axios.post<CharacterTemplate>(
            `${API_BASE_URL}/api/v1/crawl/templates`,
            template
        );
        return response.data;
    }
);

export const updateTemplate = createAsyncThunk(
    'crawl/updateTemplate',
    async (template: CharacterTemplate) => {
        const response = await axios.put<CharacterTemplate>(
            `${API_BASE_URL}/api/v1/crawl/templates/${template.ID}`,
            template
        );
        return response.data;
    }
);

export const deleteTemplate = createAsyncThunk(
    'crawl/deleteTemplate',
    async (id: number) => {
        await axios.delete(`${API_BASE_URL}/api/v1/crawl/templates/${id}`);
        return id;
    }
);

export const uploadTemplatePhoto = createAsyncThunk(
    'crawl/uploadTemplatePhoto',
    async ({ id, file }: { id: number; file: File }) => {
        const formData = new FormData();
        formData.append('photo', file);
        const response = await axios.post<CharacterTemplate>(
            `${API_BASE_URL}/api/v1/crawl/templates/${id}/photo`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response.data;
    }
);

function sortByInitiative(combatants: Combatant[]) {
    combatants.sort((a, b) => b.initiative - a.initiative);
}

const crawlSlice = createSlice({
    name: 'crawl',
    initialState,
    reducers: {
        setSearchQuery(state, action: PayloadAction<string>) {
            state.searchQuery = action.payload;
        },

        addCombatant(state, action: PayloadAction<{ template: CharacterTemplate; initiative: number }>) {
            const { template, initiative } = action.payload;
            const existingCopies = state.combatants.filter(c => c.templateId === template.ID);
            const nextCopyIndex = existingCopies.length > 0
                ? Math.max(...existingCopies.map(c => c.copyIndex)) + 1
                : 1;
            const combatant: Combatant = {
                instanceId: crypto.randomUUID(),
                templateId: template.ID,
                name: template.name,
                race: template.race,
                class: template.class,
                photo_path: template.photo_path,
                level: template.level,
                hp: template.max_hp,
                max_hp: template.max_hp,
                ac: template.ac,
                color: template.color,
                initiative,
                statusEffects: [],
                isDead: false,
                copyIndex: nextCopyIndex,
            };
            state.combatants.push(combatant);
            sortByInitiative(state.combatants);
            if (state.activeTurnIndex === -1) {
                state.activeTurnIndex = 0;
                state.round = 1;
            }
        },

        removeCombatant(state, action: PayloadAction<string>) {
            const instanceId = action.payload;
            const idx = state.combatants.findIndex(c => c.instanceId === instanceId);
            if (idx === -1) return;

            state.combatants.splice(idx, 1);

            if (state.combatants.length === 0) {
                state.activeTurnIndex = -1;
            } else if (idx < state.activeTurnIndex) {
                state.activeTurnIndex -= 1;
            } else if (state.activeTurnIndex >= state.combatants.length) {
                state.activeTurnIndex = 0;
            }
        },

        adjustHp(state, action: PayloadAction<{ instanceId: string; delta: number }>) {
            const combatant = state.combatants.find(c => c.instanceId === action.payload.instanceId);
            if (!combatant) return;

            combatant.hp = Math.max(0, Math.min(combatant.max_hp, combatant.hp + action.payload.delta));
            combatant.isDead = combatant.hp === 0;
        },

        addStatusEffect(state, action: PayloadAction<{ instanceId: string; effect: StatusEffect }>) {
            const combatant = state.combatants.find(c => c.instanceId === action.payload.instanceId);
            if (!combatant) return;
            if (!combatant.statusEffects.includes(action.payload.effect)) {
                combatant.statusEffects.push(action.payload.effect);
            }
        },

        removeStatusEffect(state, action: PayloadAction<{ instanceId: string; effect: StatusEffect }>) {
            const combatant = state.combatants.find(c => c.instanceId === action.payload.instanceId);
            if (!combatant) return;
            combatant.statusEffects = combatant.statusEffects.filter(e => e !== action.payload.effect);
        },

        nextTurn(state) {
            if (state.combatants.length === 0) return;

            const alive = state.combatants.some(c => !c.isDead);
            if (!alive) return;

            const prev = state.activeTurnIndex;
            let next = (prev + 1) % state.combatants.length;
            while (state.combatants[next].isDead) {
                next = (next + 1) % state.combatants.length;
            }
            if (next <= prev) {
                state.round += 1;
            }
            state.activeTurnIndex = next;
        },

        clearAll(state) {
            state.combatants = [];
            state.activeTurnIndex = -1;
            state.round = 0;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTemplates.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchTemplates.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.templates = action.payload ?? [];
            })
            .addCase(fetchTemplates.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message ?? 'Failed to fetch templates';
            })
            .addCase(createTemplate.fulfilled, (state, action) => {
                state.templates.push(action.payload);
            })
            .addCase(updateTemplate.fulfilled, (state, action) => {
                const idx = state.templates.findIndex(t => t.ID === action.payload.ID);
                if (idx !== -1) state.templates[idx] = action.payload;
            })
            .addCase(deleteTemplate.fulfilled, (state, action) => {
                state.templates = state.templates.filter(t => t.ID !== action.payload);
            })
            .addCase(uploadTemplatePhoto.fulfilled, (state, action) => {
                const idx = state.templates.findIndex(t => t.ID === action.payload.ID);
                if (idx !== -1) state.templates[idx] = action.payload;
            });
    },
});

export const {
    setSearchQuery,
    addCombatant,
    removeCombatant,
    adjustHp,
    addStatusEffect,
    removeStatusEffect,
    nextTurn,
    clearAll,
} = crawlSlice.actions;

export default crawlSlice.reducer;
