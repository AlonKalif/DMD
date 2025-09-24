// src/app/App.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { AppRouter } from 'routes/AppRouter'; // Import the router

test('renders the DM dashboard page on the root path', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <AppRouter /> {/* Render the router */}
    </MemoryRouter>
  );
  
  // Look for the text that's actually in DmDashboardPage.tsx
  const headingElement = screen.getByText(/DM Dashboard/i);
  expect(headingElement).toBeInTheDocument();
});