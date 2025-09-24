// src/layouts/RootLayout.tsx
import { Outlet } from 'react-router-dom';
import './RootLayout.css'; // Update CSS import

function RootLayout() { // Rename function
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default RootLayout; // Update export