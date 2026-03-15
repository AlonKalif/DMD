import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { CharacterTemplate } from 'types/api';
import { API_BASE_URL } from 'config';

interface CrawlState {
    templates: CharacterTemplate[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    searchQuery: string;
}

const initialState: CrawlState = {
    templates: [],
    status: 'idle',
    error: null,
    searchQuery: '',
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

const crawlSlice = createSlice({
    name: 'crawl',
    initialState,
    reducers: {
        setSearchQuery(state, action: PayloadAction<string>) {
            state.searchQuery = action.payload;
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

export const { setSearchQuery } = crawlSlice.actions;
export default crawlSlice.reducer;
