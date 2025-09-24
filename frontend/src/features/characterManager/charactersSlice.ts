// src/features/characterManager/charactersSlice.ts
import { createSlice } from '@reduxjs/toolkit';

// Using a Record for efficient lookups by character ID
type CharacterStore = Record<string, any>; // Placeholder type

interface CharactersState {
  pcs: CharacterStore;
}

const initialState: CharactersState = {
  pcs: {},
};

const charactersSlice = createSlice({
  name: 'characters',
  initialState,
  reducers: {},
});

export const {} = charactersSlice.actions;
export default charactersSlice.reducer;