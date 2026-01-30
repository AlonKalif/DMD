## Running Chrome Inside WSL2

### Requirements

- **Windows 11** or newer (with WSLg)
- WSLg is included by default in Windows 11

### Advantages

✅ No port forwarding needed  
✅ Survives WSL2 IP changes  
✅ `localhost` works naturally  
✅ Simpler networking setup  

### Disadvantages

❌ Requires Windows 11+  
❌ Chrome uses separate WSL2 profile (different from Windows Chrome)  
❌ Extensions need reinstalling  

---

## Installation

### Step 1: Install Chrome in WSL2

```bash
# Download Chrome .deb package
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb

# Install Chrome
sudo apt install ./google-chrome-stable_current_amd64.deb

# Clean up installer
rm google-chrome-stable_current_amd64.deb
```

### Step 2: Verify Installation

```bash
google-chrome --version
```

Should output something like: `Google Chrome 120.0.6099.129`

---

## Usage

### Start Application

**Terminal 1: Backend**
```bash
cd backend
go run cmd/main.go
```

**Terminal 2: Frontend**
```bash
cd frontend
npm start
```

**Terminal 3: Chrome**
```bash
google-chrome http://localhost:3000
```

Chrome opens in Windows (via WSLg) but uses WSL2's network, so `localhost` points to WSL2.

### Opening Both Windows

```bash
# DM Window
google-chrome http://localhost:3000

# Player Window (in separate window)
google-chrome --new-window http://localhost:3000/player
```

---

## Notes

- Chrome window appears in Windows but runs in WSL2 context
- Browser profile stored in WSL2 filesystem (`~/.config/google-chrome/`)
- Different profile than native Windows Chrome
- GPU acceleration works via WSLg
