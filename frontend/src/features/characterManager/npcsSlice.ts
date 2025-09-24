// src/features/characterManager/npcsSlice.ts
import { createSlice } from '@reduxjs/toolkit';

type NpcStore = Record<string, any>; // Placeholder type

interface NpcsState {
  npcs: NpcStore;
}

const initialState: NpcsState = {
  npcs: {},
};

const npcsSlice = createSlice({
  name: 'npcs',
  initialState,
  reducers: {},
});

export const {} = npcsSlice.actions;
export default npcsSlice.reducer;