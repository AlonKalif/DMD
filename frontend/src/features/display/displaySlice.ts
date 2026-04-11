// /src/features/display/displaySlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LayoutState } from 'pages/ScreenMirroringPage';
import { BattleDisplayPayload } from 'types/api';

type DisplayMode = 'layout' | 'battle' | null;

interface DisplayState {
    displayMode: DisplayMode;
    currentLayout: LayoutState | null;
    battleState: BattleDisplayPayload | null;
}

const initialState: DisplayState = {
    displayMode: null,
    currentLayout: null,
    battleState: null,
};

const displaySlice = createSlice({
    name: 'display',
    initialState,
    reducers: {
        setCurrentLayout(state, action: PayloadAction<LayoutState>) {
            state.displayMode = 'layout';
            state.currentLayout = action.payload;
            state.battleState = null;
        },
        clearLayout(state) {
            state.displayMode = null;
            state.currentLayout = null;
        },
        setBattleState(state, action: PayloadAction<BattleDisplayPayload>) {
            state.displayMode = 'battle';
            state.battleState = action.payload;
            state.currentLayout = null;
        },
        clearBattle(state) {
            state.displayMode = null;
            state.battleState = null;
        },
    },
});

export const { setCurrentLayout, clearLayout, setBattleState, clearBattle } = displaySlice.actions;

export default displaySlice.reducer;
