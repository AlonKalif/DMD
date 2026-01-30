## Frontend Troubleshooting

### Port 3000 Already in Use

**Symptom:**
```
Error: Something is already running on port 3000
```

**Solution:**

Kill the existing process or use a different port:

**Linux/macOS:**
```bash
lsof -i :3000
kill -9 <PID>
```

**Windows:**
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Or use different port:**
```bash
PORT=3001 npm start
```

---

### npm install Fails

**Symptom:**
```
npm ERR! code ERESOLVE
```

**Solution:**
- Delete `node_modules/` and `package-lock.json`
- Run `npm install` again
- Check Node.js version: `node --version` (should be 18+)

---

### Module Not Found Errors

**Symptom:**
```
Module not found: Can't resolve 'some-package'
```

**Solution:**
- Run `npm install` again
- Check for typos in import statements
