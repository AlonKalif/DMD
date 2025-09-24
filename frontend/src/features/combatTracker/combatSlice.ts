// src/features/combatTracker/combatSlice.ts
import { createSlice } from '@reduxjs/toolkit';

// We'll define a proper Combatant type later in src/types
interface CombatState {
  isActive: boolean;
  round: number;
  turn: number;
  combatants: any[]; // Placeholder type
}

const initialState: CombatState = {
  isActive: false,
  round: 0,
  turn: 0,
  combatants: [],
};

const combatSlice = createSlice({
  name: 'combat',
  initialState,
  reducers: {
    // Reducers like startCombat, nextTurn, addCombatant, etc. will go here
  },
});

export const {} = combatSlice.actions;
export default combatSlice.reducer;