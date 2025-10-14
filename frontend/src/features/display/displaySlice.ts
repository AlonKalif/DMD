// /src/features/display/displaySlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LayoutState } from 'pages/ScreenMirroringPage'; // Assuming types are exported from here

interface DisplayState {
    currentLayout: LayoutState | null;
}

const initialState: DisplayState = {
    currentLayout: null,
};

const displaySlice = createSlice({
    name: 'display',
    initialState,
    reducers: {
        // Sets the entire layout state for the player window
        setCurrentLayout(state, action: PayloadAction<LayoutState>) {
            state.currentLayout = action.payload;
        },
        // Clears the layout, returning to the default view
        clearLayout(state) {
            state.currentLayout = null;
        },
    },
});

export const { setCurrentLayout, clearLayout } = displaySlice.actions;

export default displaySlice.reducer;