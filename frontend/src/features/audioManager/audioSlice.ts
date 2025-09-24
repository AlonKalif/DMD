// src/features/audioManager/audioSlice.ts
import { createSlice } from '@reduxjs/toolkit';

interface AudioState {
  masterVolume: number;
  isPlaying: boolean;
  currentTrack: any | null; // Placeholder type
}

const initialState: AudioState = {
  masterVolume: 100,
  isPlaying: false,
  currentTrack: null,
};

const audioSlice = createSlice({
  name: 'audio',
  initialState,
  reducers: {},
});

export const {} = audioSlice.actions;
export default audioSlice.reducer;