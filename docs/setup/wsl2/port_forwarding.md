## WSL2 Port Forwarding Setup

### Step 1: Find Your WSL2 IP Address

In **PowerShell** (on Windows):

```powershell
wsl hostname -I
```

**Example output:** `172.18.31.33`

Copy this IP address for the next step.

### Step 2: Setup Port Forwarding

In **PowerShell as Administrator**:

```powershell
# Replace 172.18.31.33 with YOUR WSL2 IP from step 1
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=127.0.0.1 connectport=8080 connectaddress=172.18.31.33
```

**What this does:**
- Listens on `127.0.0.1:8080` (Windows localhost)
- Forwards all traffic to `172.18.31.33:8080` (WSL2 backend)

### Step 3: Verify Configuration

```powershell
netsh interface portproxy show all
```

**Expected output:**
```
Listen on ipv4:             Connect to ipv4:

Address         Port        Address         Port
--------------- ----------  --------------- ----------
127.0.0.1       8080        172.18.31.33    8080
```

### Step 4: Test Connection

1. Start backend in WSL2: `go run cmd/main.go`
2. In Windows Chrome: Open `http://127.0.0.1:8080/health`
3. Should see: `{"status": "ok"}`

---

## After WSL2 Restarts

**Problem:** WSL2 IP address can change after Windows restart.

**Symptoms:**
- Backend runs but Chrome can't connect
- "Connection refused" errors

**Solution:** Update port forwarding with new IP

### Quick Fix Script

In **PowerShell as Administrator**:

```powershell
# Remove old forwarding rule
netsh interface portproxy delete v4tov4 listenport=8080 listenaddress=127.0.0.1

# Get new WSL2 IP
wsl hostname -I

# Add new forwarding rule (replace with your new IP)
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=127.0.0.1 connectport=8080 connectaddress=NEW_WSL2_IP
```

### Automating Port Forwarding (Optional)

Create a PowerShell script to automate this:

```powershell
# save as update-wsl-port-forward.ps1
$wslIp = (wsl hostname -I).Trim()
netsh interface portproxy delete v4tov4 listenport=8080 listenaddress=127.0.0.1
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=127.0.0.1 connectport=8080 connectaddress=$wslIp
Write-Host "Port forwarding updated for WSL2 IP: $wslIp"
```

Run as Administrator after each Windows restart.
