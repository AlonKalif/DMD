// File: /src/features/display/displaySlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DisplayContent {
    type: 'image' | 'map' | 'text';
    payload: any;
}

interface DisplayState {
    currentContent: DisplayContent | null;
}

const initialState: DisplayState = {
    currentContent: null,
};

const displaySlice = createSlice({
    name: 'display',
    initialState,
    reducers: {
        setCurrentContent: (state, action: PayloadAction<DisplayContent>) => {
            state.currentContent = action.payload;
        },
        clearContent: (state) => {
            state.currentContent = null;
        },
    },
});

export const { setCurrentContent, clearContent } = displaySlice.actions;
export default displaySlice.reducer;