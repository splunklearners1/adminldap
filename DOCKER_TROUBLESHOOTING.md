# Docker Deployment - Troubleshooting Guide

## Issue: "Cannot GET /" Error

This error occurs when the web server is running but the HTML files aren't being served properly.

---

## Solution: Rebuild and Restart Docker Container

### **Step 1: Stop Current Container**

Open PowerShell or Command Prompt in the Ldap folder and run:

```powershell
docker-compose down
```

### **Step 2: Rebuild the Container**

This ensures all files (including the public directory) are properly copied:

```powershell
docker-compose build --no-cache
```

### **Step 3: Start the Container**

```powershell
docker-compose up -d
```

### **Step 4: Verify Container is Running**

```powershell
docker-compose ps
```

You should see:
```
NAME                COMMAND             SERVICE             STATUS              PORTS
ldap-web-ldap-1     "npm start"         web-ldap            Up                  0.0.0.0:1389->1389/tcp, 0.0.0.0:3000->3000/tcp
```

### **Step 5: Check Container Logs**

```powershell
docker-compose logs -f
```

You should see:
```
web-ldap-1  | LDAP Server listening at ldap://localhost:1389
web-ldap-1  | Web Interface listening at http://localhost:3000
```

Press `Ctrl+C` to exit logs.

### **Step 6: Test the Web Interface**

Open browser and go to:
```
http://172.31.9.197:3000
```

You should now see the LDAP user management interface!

---

## Alternative: One-Command Fix

Run all steps at once:

```powershell
docker-compose down && docker-compose build --no-cache && docker-compose up -d && docker-compose logs -f
```

Press `Ctrl+C` after you see the server started successfully.

---

## Verify Files Inside Container

If still having issues, check if files exist inside the container:

```powershell
# List files in container
docker-compose exec web-ldap ls -la /app/public

# Should show:
# index.html
# style.css
# app.js
```

If files are missing, the issue is with the build process.

---

## Common Issues

### Issue 1: Port Already in Use

**Error**: `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution**:
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
# Change "3000:3000" to "3001:3000"
```

### Issue 2: Container Keeps Restarting

**Check logs**:
```powershell
docker-compose logs web-ldap
```

**Common causes**:
- Missing dependencies (rebuild with `--no-cache`)
- Syntax error in server.js
- Missing users.json file

### Issue 3: Can Access from localhost but not from IP

**Solution**: Ensure Docker is binding to all interfaces

In `docker-compose.yml`, ports should be:
```yaml
ports:
  - "3000:3000"  # Not "127.0.0.1:3000:3000"
  - "1389:1389"  # Not "127.0.0.1:1389:1389"
```

---

## Testing LDAP Server

### Test LDAP Port

```powershell
# Test if LDAP port is accessible
Test-NetConnection -ComputerName 172.31.9.197 -Port 1389
```

### Test Web Port

```powershell
# Test if Web port is accessible
Test-NetConnection -ComputerName 172.31.9.197 -Port 3000
```

### Test with curl

```powershell
# Test web interface
curl http://172.31.9.197:3000

# Should return HTML content
```

---

## Splunk Configuration with Docker

When configuring Splunk to use this LDAP server running in Docker:

### If Splunk is on the SAME host:

| Setting | Value |
|---------|-------|
| **Host** | `172.31.9.197` or `localhost` |
| **Port** | `1389` |

### If Splunk is on a DIFFERENT host:

| Setting | Value |
|---------|-------|
| **Host** | `172.31.9.197` (Docker host IP) |
| **Port** | `1389` |

### If Splunk is ALSO in Docker:

**Option 1**: Use Docker network
```yaml
# In docker-compose.yml, add network
networks:
  - splunk-network
```

**Option 2**: Use host network mode
```yaml
network_mode: "host"
```

**Option 3**: Use Docker host gateway
- **Host**: `host.docker.internal` (Windows/Mac)
- **Host**: `172.17.0.1` (Linux)

---

## Complete Restart Procedure

If everything fails, complete reset:

```powershell
# 1. Stop and remove everything
docker-compose down -v

# 2. Remove old images
docker-compose rm -f

# 3. Rebuild from scratch
docker-compose build --no-cache

# 4. Start fresh
docker-compose up -d

# 5. Watch logs
docker-compose logs -f
```

---

## Quick Health Check

Run this to verify everything is working:

```powershell
# Check container status
docker-compose ps

# Check logs for errors
docker-compose logs --tail=50

# Check if web interface responds
curl http://172.31.9.197:3000

# Check if LDAP port is open
Test-NetConnection -ComputerName 172.31.9.197 -Port 1389
```

---

## Success Indicators

✅ Container status shows "Up"  
✅ Logs show "LDAP Server listening at ldap://localhost:1389"  
✅ Logs show "Web Interface listening at http://localhost:3000"  
✅ `curl http://172.31.9.197:3000` returns HTML  
✅ Browser shows LDAP user management interface  
✅ No error messages in logs  

---

## Need More Help?

Check container details:
```powershell
docker-compose exec web-ldap cat /app/server.js | head -20
docker-compose exec web-ldap ls -la /app
docker-compose exec web-ldap cat /app/package.json
```
