// /src/routes/AppRouter.tsx
import { Route, Routes } from 'react-router-dom';
import DmLayout from 'layouts/DmLayout';
import PlayerDisplayPage from 'pages/PlayerDisplayPage';
import ScreenMirroringPage from 'pages/ScreenMirroringPage';
import AudioPlayerPage from 'pages/AudioPlayerPage';
import DungeonCrawlPage from 'pages/DungeonCrawlPage';
// --- Add these imports ---
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export function AppRouter() {
    return (
        // --- Wrap the entire Routes component with DndProvider ---
        <DndProvider backend={HTML5Backend}>
            <Routes>
                {/* Routes for the DM Window */}
                <Route path="/" element={<DmLayout />}>
                    <Route index element={<ScreenMirroringPage />} />
                    <Route path="audio" element={<AudioPlayerPage />} />
                    <Route path="crawl" element={<DungeonCrawlPage />} />
                </Route>

                {/* Route for the separate Player Window */}
                <Route path="/player" element={<PlayerDisplayPage />} />
            </Routes>
        </DndProvider>
    );
}