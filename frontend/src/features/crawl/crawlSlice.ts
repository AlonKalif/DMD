import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { CharacterTemplate, Combatant, StatusEffect } from 'types/api';
import { API_BASE_URL } from 'config';

interface CrawlState {
    templates: CharacterTemplate[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    pcSearchQuery: string;
    monsterSearchQuery: string;
    combatants: Combatant[];
    activeTurnIndex: number;
    round: number;
}

const initialState: CrawlState = {
    templates: [],
    status: 'idle',
    error: null,
    pcSearchQuery: '',
    monsterSearchQuery: '',
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

function findTemplate(templates: CharacterTemplate[], templateId: number) {
    return templates.find(t => t.ID === templateId);
}

const crawlSlice = createSlice({
    name: 'crawl',
    initialState,
    reducers: {
        setPcSearchQuery(state, action: PayloadAction<string>) {
            state.pcSearchQuery = action.payload;
        },

        setMonsterSearchQuery(state, action: PayloadAction<string>) {
            state.monsterSearchQuery = action.payload;
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
                hp: template.max_hp,
                max_hp: template.max_hp,
                ac: template.ac,
                initiative,
                statusEffects: [],
                isDead: false,
                isInDeathSave: false,
                deathSaveCount: 0,
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
            if (!combatant || combatant.isInDeathSave || combatant.isDead) return;

            combatant.hp = Math.max(0, Math.min(combatant.max_hp, combatant.hp + action.payload.delta));

            if (combatant.hp === 0) {
                combatant.statusEffects = [];
                const template = findTemplate(state.templates, combatant.templateId);
                if (template?.character_type === 'pc') {
                    combatant.isInDeathSave = true;
                    combatant.deathSaveCount = 0;
                } else {
                    combatant.isDead = true;
                }
            }
        },

        addStatusEffect(state, action: PayloadAction<{ instanceId: string; effect: StatusEffect }>) {
            const combatant = state.combatants.find(c => c.instanceId === action.payload.instanceId);
            if (!combatant) return;
            const template = state.templates.find(t => t.ID === combatant.templateId);
            if (template?.immunities?.includes(action.payload.effect)) return;
            if (!combatant.statusEffects.includes(action.payload.effect)) {
                combatant.statusEffects.push(action.payload.effect);
            }
        },

        removeStatusEffect(state, action: PayloadAction<{ instanceId: string; effect: StatusEffect }>) {
            const combatant = state.combatants.find(c => c.instanceId === action.payload.instanceId);
            if (!combatant) return;
            combatant.statusEffects = combatant.statusEffects.filter(e => e !== action.payload.effect);
        },

        adjustDeathSave(state, action: PayloadAction<{ instanceId: string; delta: number }>) {
            const combatant = state.combatants.find(c => c.instanceId === action.payload.instanceId);
            if (!combatant || !combatant.isInDeathSave) return;

            combatant.deathSaveCount = Math.max(-3, Math.min(3, combatant.deathSaveCount + action.payload.delta));

            if (combatant.deathSaveCount >= 3) {
                combatant.isInDeathSave = false;
                combatant.deathSaveCount = 0;
                combatant.hp = 1;
            } else if (combatant.deathSaveCount <= -3) {
                combatant.isInDeathSave = false;
                combatant.deathSaveCount = 0;
                combatant.isDead = true;
                combatant.statusEffects = [];
            }
        },

        reviveCombatant(state, action: PayloadAction<string>) {
            const combatant = state.combatants.find(c => c.instanceId === action.payload);
            if (!combatant || !combatant.isDead) return;

            combatant.isDead = false;
            combatant.isInDeathSave = false;
            combatant.deathSaveCount = 0;
            combatant.hp = 1;
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
    setPcSearchQuery,
    setMonsterSearchQuery,
    addCombatant,
    removeCombatant,
    adjustHp,
    addStatusEffect,
    removeStatusEffect,
    adjustDeathSave,
    reviveCombatant,
    nextTurn,
    clearAll,
} = crawlSlice.actions;

export function selectTemplateForCombatant(
    templates: CharacterTemplate[],
    templateId: number,
): CharacterTemplate | undefined {
    return templates.find(t => t.ID === templateId);
}

export default crawlSlice.reducer;
