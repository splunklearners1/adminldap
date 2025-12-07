# Deploy Updated LDAP Server to Linux

## Quick Deploy Steps

### **Option 1: If you have SSH access from Windows**

Run these commands from PowerShell in the Ldap folder:

```powershell
# Navigate to Ldap folder
cd C:\Users\Administrator\Desktop\Drive\Ldap

# Transfer all updated files (replace 'user' and path)
scp users.json user@172.31.9.197:/path/to/Ldap/
scp server.js user@172.31.9.197:/path/to/Ldap/
scp docker-compose.yml user@172.31.9.197:/path/to/Ldap/
scp public/index.html user@172.31.9.197:/path/to/Ldap/public/
scp public/style.css user@172.31.9.197:/path/to/Ldap/public/
scp public/app.js user@172.31.9.197:/path/to/Ldap/public/

# Then SSH to Linux and rebuild
ssh user@172.31.9.197
cd /path/to/Ldap
docker-compose down
docker-compose build --no-cache
docker-compose up -d
docker-compose logs -f
```

---

### **Option 2: If files are already on Linux (Git/Shared folder)**

Just SSH to Linux and rebuild:

```bash
ssh user@172.31.9.197
cd /path/to/Ldap

# Pull latest changes if using Git
git pull

# Rebuild container
docker-compose down
docker-compose build --no-cache
docker-compose up -d
docker-compose logs -f
```

---

### **Option 3: Manual file transfer (WinSCP/FileZilla)**

1. Open WinSCP or FileZilla
2. Connect to `172.31.9.197`
3. Navigate to the Ldap directory on Linux
4. Upload these files:
   - `users.json`
   - `server.js`
   - `docker-compose.yml`
   - `public/index.html`
   - `public/style.css`
   - `public/app.js`

5. SSH to Linux and rebuild:
```bash
ssh user@172.31.9.197
cd /path/to/Ldap
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Files That Need to Be Updated

| File | What Changed |
|------|--------------|
| `users.json` | Added salesuser1, salesuser2, SalesUserGroup |
| `server.js` | Added group API endpoints |
| `docker-compose.yml` | Added public directory mount |
| `public/index.html` | Added Groups tab and table |
| `public/style.css` | Added tab and group styling |
| `public/app.js` | Added group fetching and display logic |

---

## Verify It's Working

After rebuilding:

1. **Check logs**:
   ```bash
   docker-compose logs --tail=20
   ```
   
   Should show:
   ```
   LDAP Server listening at ldap://localhost:1389
   Web Interface listening at http://localhost:3000
   ```

2. **Test API endpoint**:
   ```bash
   curl http://localhost:3000/api/groups
   ```
   
   Should return JSON with 4 groups

3. **Open browser**:
   ```
   http://172.31.9.197:3000
   ```
   
   Click "Groups" tab - should show 4 groups!

---

## Troubleshooting

### **Still don't see groups?**

1. **Check if files were transferred**:
   ```bash
   ssh user@172.31.9.197
   cd /path/to/Ldap
   ls -la public/
   cat server.js | grep "api/groups"
   ```

2. **Check if container rebuilt**:
   ```bash
   docker-compose ps
   docker-compose logs | grep "api/groups"
   ```

3. **Test API directly**:
   ```bash
   curl http://172.31.9.197:3000/api/groups
   ```
   
   If this returns groups, but UI doesn't show them, it's a frontend issue.

4. **Check browser console**:
   - Open browser to `http://172.31.9.197:3000`
   - Press F12 to open Developer Tools
   - Click "Console" tab
   - Click "Groups" tab in the app
   - Look for errors

5. **Clear browser cache**:
   - Press Ctrl+Shift+R to hard refresh
   - Or Ctrl+Shift+Delete to clear cache

---

## Quick Test Without Rebuild

If you want to test locally on Windows first:

```powershell
cd C:\Users\Administrator\Desktop\Drive\Ldap
npm start
```

Then open: `http://localhost:3000`

Click "Groups" tab - you should see 4 groups!

If it works locally but not on Linux, the issue is with file transfer or Docker rebuild.

---

## Summary

**Why you don't see groups:**
- Updated code is only on Windows
- Linux server still has old code
- Docker container needs to be rebuilt

**Solution:**
1. Transfer updated files to Linux
2. Rebuild Docker container
3. Refresh browser

**Expected result:**
- Groups tab appears
- 4 groups visible: SalesUserGroup, SplunkAdmins, SplunkPowerUsers, SplunkUsers
