// src/routes/AppRouter.tsx
import { Route, Routes } from 'react-router-dom';

import RootLayout from 'layouts/RootLayout'; // Corrected import
import DmDashboardPage from 'pages/DmDashboardPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}> {/* Use RootLayout */}
        <Route index element={<DmDashboardPage />} />
      </Route>
    </Routes>
  );
}