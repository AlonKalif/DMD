// src/app/store.ts
import { configureStore } from '@reduxjs/toolkit';

import audioReducer from 'features/audioManager/audioSlice';
import charactersReducer from 'features/characterManager/charactersSlice';
import npcsReducer from 'features/characterManager/npcsSlice';
import combatReducer from 'features/combatTracker/combatSlice';
import uiReducer from 'features/ui/uiSlice';
import displayReducer from '../features/display/displaySlice';
import imagesReducer from '../features/images/imageSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    combat: combatReducer,
    characters: charactersReducer,
    npcs: npcsReducer,
    audio: audioReducer,
    display: displayReducer,
    images: imagesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;