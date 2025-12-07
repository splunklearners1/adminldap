# Docker Deployment on Linux - Fix Guide

## Issue: "Cannot GET /" Error

Your LDAP server is running in Docker on a Linux host at `172.31.9.197:3000` but showing "Cannot GET /" error.

---

## **Solution: Rebuild Docker Container on Linux**

### **Step 1: Connect to Linux Host**

From your Windows machine, connect to the Linux host via SSH:

```bash
ssh user@172.31.9.197
```

Replace `user` with your actual username.

### **Step 2: Navigate to Ldap Directory**

```bash
cd /path/to/Ldap
```

(Navigate to wherever you have the Ldap project on the Linux host)

### **Step 3: Stop Current Container**

```bash
docker-compose down
```

### **Step 4: Rebuild Container**

```bash
docker-compose build --no-cache
```

This ensures all files (including the `public` directory) are properly copied into the container.

### **Step 5: Start Container**

```bash
docker-compose up -d
```

### **Step 6: Verify Container is Running**

```bash
docker-compose ps
```

You should see:
```
NAME                COMMAND             SERVICE             STATUS              PORTS
ldap-web-ldap-1     "npm start"         web-ldap            Up                  0.0.0.0:1389->1389/tcp, 0.0.0.0:3000->3000/tcp
```

### **Step 7: Check Logs**

```bash
docker-compose logs -f
```

You should see:
```
web-ldap-1  | LDAP Server listening at ldap://localhost:1389
web-ldap-1  | Web Interface listening at http://localhost:3000
```

Press `Ctrl+C` to exit logs.

### **Step 8: Test from Windows**

Open browser on your Windows machine and go to:
```
http://172.31.9.197:3000
```

You should now see the LDAP user management interface!

---

## **Quick Fix - One Command**

On the Linux host, run:

```bash
docker-compose down && docker-compose build --no-cache && docker-compose up -d && docker-compose logs -f
```

Press `Ctrl+C` after you see the server started successfully.

---

## **Alternative: Use the Rebuild Script**

### **Option 1: Copy Files to Linux Host**

From your Windows machine, copy the updated files to the Linux host:

```powershell
# Using SCP from Windows PowerShell
scp docker-compose.yml user@172.31.9.197:/path/to/Ldap/
scp users.json user@172.31.9.197:/path/to/Ldap/
scp rebuild_docker.sh user@172.31.9.197:/path/to/Ldap/
```

### **Option 2: Run the Script on Linux**

SSH into the Linux host and run:

```bash
cd /path/to/Ldap
chmod +x rebuild_docker.sh
./rebuild_docker.sh
```

---

## **Verify Files Exist in Container**

Check if the `public` directory files are inside the container:

```bash
docker-compose exec web-ldap ls -la /app/public
```

Should show:
```
-rw-r--r-- 1 node node 3999 Dec  7 04:00 app.js
-rw-r--r-- 1 node node 4649 Dec  7 04:00 index.html
-rw-r--r-- 1 node node 5340 Dec  7 04:00 style.css
```

If files are missing, the `public` directory wasn't copied during build.

---

## **Check File Permissions on Linux**

Ensure the files have correct permissions:

```bash
# On Linux host
cd /path/to/Ldap
ls -la public/

# Should show readable files
# If not, fix permissions:
chmod -R 755 public/
```

---

## **Ensure Updated docker-compose.yml is on Linux**

The `docker-compose.yml` on the Linux host should have:

```yaml
version: '3.8'

services:
  web-ldap:
    build: .
    ports:
      - "3000:3000"
      - "1389:1389"
    volumes:
      - ./users.json:/app/users.json
      - ./public:/app/public          # ← This line is important
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

If it doesn't have the `./public:/app/public` line, add it and rebuild.

---

## **Transfer Updated Files from Windows to Linux**

### **Method 1: Using SCP (Secure Copy)**

From Windows PowerShell:

```powershell
# Navigate to Ldap folder
cd C:\Users\Administrator\Desktop\Drive\Ldap

# Copy updated docker-compose.yml
scp docker-compose.yml user@172.31.9.197:/path/to/Ldap/

# Copy updated users.json (with salesuser1, salesuser2)
scp users.json user@172.31.9.197:/path/to/Ldap/

# Copy public directory
scp -r public user@172.31.9.197:/path/to/Ldap/
```

### **Method 2: Using WinSCP or FileZilla**

1. Open WinSCP or FileZilla
2. Connect to `172.31.9.197`
3. Navigate to the Ldap directory on Linux
4. Upload:
   - `docker-compose.yml`
   - `users.json`
   - `public/` directory (entire folder)

### **Method 3: Using Git (if project is in Git)**

On Linux host:

```bash
cd /path/to/Ldap
git pull origin main
```

---

## **Common Linux-Specific Issues**

### **Issue 1: Permission Denied**

**Error**: `Permission denied while trying to connect to the Docker daemon socket`

**Solution**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and log back in, or run:
newgrp docker

# Or run with sudo
sudo docker-compose down
sudo docker-compose build --no-cache
sudo docker-compose up -d
```

### **Issue 2: Port Already in Use**

**Check what's using the port**:
```bash
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :1389
```

**Kill the process**:
```bash
sudo kill -9 <PID>
```

### **Issue 3: Firewall Blocking Ports**

**Open ports on Linux firewall**:

For **UFW** (Ubuntu):
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 1389/tcp
sudo ufw reload
```

For **firewalld** (CentOS/RHEL):
```bash
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=1389/tcp
sudo firewall-cmd --reload
```

For **iptables**:
```bash
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 1389 -j ACCEPT
sudo iptables-save
```

---

## **Testing from Linux Host**

### **Test Web Interface Locally**

On the Linux host:

```bash
curl http://localhost:3000
```

Should return HTML content.

### **Test Web Interface from Network**

On the Linux host:

```bash
curl http://172.31.9.197:3000
```

Should return HTML content.

### **Test LDAP Port**

```bash
nc -zv 172.31.9.197 1389
```

Should show: `Connection to 172.31.9.197 1389 port [tcp/*] succeeded!`

---

## **Complete Rebuild Procedure (Linux)**

If everything fails, complete reset:

```bash
# 1. Stop and remove everything
docker-compose down -v

# 2. Remove old images
docker-compose rm -f
docker rmi $(docker images -q ldap-web-ldap)

# 3. Clean Docker system (optional, removes unused data)
docker system prune -a

# 4. Rebuild from scratch
docker-compose build --no-cache

# 5. Start fresh
docker-compose up -d

# 6. Watch logs
docker-compose logs -f
```

---

## **Splunk Configuration (Connecting to Linux LDAP)**

When configuring Splunk to connect to this LDAP server on Linux:

### **If Splunk is on Windows (your current machine)**

| Setting | Value |
|---------|-------|
| **Host** | `172.31.9.197` |
| **Port** | `1389` |
| **Bind DN** | `cn=ldapadmin,ou=users,o=splunk` |
| **Bind Password** | `password` |

### **If Splunk is also on the Linux host**

| Setting | Value |
|---------|-------|
| **Host** | `localhost` or `127.0.0.1` |
| **Port** | `1389` |

### **If Splunk is in another Docker container on same Linux host**

| Setting | Value |
|---------|-------|
| **Host** | `172.17.0.1` (Docker bridge gateway) |
| **Port** | `1389` |

Or use Docker networking:
```yaml
# In both docker-compose files
networks:
  - shared-network
```

---

## **Monitoring Container Health**

### **Check Container Status**

```bash
docker-compose ps
docker-compose logs --tail=50
```

### **Check Resource Usage**

```bash
docker stats
```

### **Enter Container for Debugging**

```bash
docker-compose exec web-ldap sh

# Inside container:
ls -la /app
ls -la /app/public
cat /app/server.js | grep static
exit
```

---

## **Quick Health Check Commands**

Run these on the Linux host:

```bash
# Container running?
docker-compose ps | grep Up

# Logs show success?
docker-compose logs | grep "listening"

# Web interface responds?
curl -I http://localhost:3000

# LDAP port open?
nc -zv localhost 1389

# Files exist in container?
docker-compose exec web-ldap ls /app/public
```

---

## **Summary - Steps to Fix**

1. **SSH to Linux host**: `ssh user@172.31.9.197`
2. **Navigate to Ldap folder**: `cd /path/to/Ldap`
3. **Stop container**: `docker-compose down`
4. **Rebuild**: `docker-compose build --no-cache`
5. **Start**: `docker-compose up -d`
6. **Check logs**: `docker-compose logs -f`
7. **Test from Windows**: Open `http://172.31.9.197:3000` in browser

✅ Web interface should now work!
