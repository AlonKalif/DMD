## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

This installs all packages defined in `package.json`. First install may take 2-3 minutes.

### 3. Run the Development Server

```bash
npm start
```

**What happens:**
- Dev server starts on `localhost:3000`
- Browser automatically opens to `http://localhost:3000`
- Hot module replacement enabled (changes reload automatically)
- React developer tools available

### 4. Verify Frontend is Running

The browser should open automatically and show the Screen Mirroring page (DM Window).

**Manual verification:**
- Open `http://localhost:3000` - DM control interface
- Open `http://localhost:3000/player` - Player display (move to second monitor)

### Available npm Scripts

```bash
npm start       # Start development server
npm run build   # Build for production
npm test        # Run tests
npm run lint    # Check code quality
npm run format  # Format code with Prettier
```

### Frontend Console Output

You should see:

```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.X:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully
```

### Troubleshooting

If you encounter errors, see [Frontend Troubleshooting](../troubleshooting/frontend.md)
