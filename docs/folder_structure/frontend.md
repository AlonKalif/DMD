## Frontend Folder Structure

### `/frontend` Directory

```
frontend/
├── public/                     # Static assets
├── src/
│   ├── app/                    # Redux store configuration
│   ├── components/
│   │   ├── layout/             # Layout components (NavBar, etc.)
│   │   ├── screen-mirroring/   # Screen mirroring UI components
│   │   ├── spotify/            # Spotify integration components
│   │   └── dm/                 # DM-specific components
│   ├── features/               # Redux slices (state management)
│   │   ├── audioManager/
│   │   ├── characterManager/
│   │   ├── combatTracker/
│   │   ├── display/            # Player window state
│   │   ├── images/             # Image library state
│   │   ├── spotify/            # Spotify state
│   │   └── ui/                 # UI state (modals, notifications)
│   ├── hooks/                  # Custom React hooks
│   ├── layouts/                # Page layouts
│   ├── pages/                  # Top-level page components
│   ├── routes/                 # React Router configuration
│   ├── services/               # API service functions
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Utility functions
│   ├── config.ts               # API base URL configuration
│   ├── index.tsx               # React entry point
│   └── index.css               # Tailwind imports
├── .env                        # Development environment variables
├── .env.production             # Production environment variables
├── .eslintrc.json              # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── package.json
├── package-lock.json
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js
├── STYLE_GUIDE.md              # Frontend coding standards
└── README.md
```
