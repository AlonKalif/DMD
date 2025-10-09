// File: /src/features/images/imageSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { MediaAsset } from 'types/api';
import { API_BASE_URL } from 'config';

interface ImagesState {
    items: MediaAsset[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: ImagesState = {
    items: [],
    status: 'idle',
};

// Create an async thunk to fetch the image list from the API.
export const fetchImages = createAsyncThunk('images/fetchImages', async () => {
    const response = await axios.get<MediaAsset[]>(`${API_BASE_URL}/api/v1/images/images`);
    return response.data;
});

const imageSlice = createSlice({
    name: 'images',
    initialState,
    reducers: {},
    // Handle the different states of our async thunk.
    extraReducers: (builder) => {
        builder
            .addCase(fetchImages.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchImages.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchImages.rejected, (state) => {
                state.status = 'failed';
            });
    },
});

export default imageSlice.reducer;