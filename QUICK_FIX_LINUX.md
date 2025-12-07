# Quick Fix - Docker on Linux Host (172.31.9.197)

## Problem
- Docker running on Linux host at `172.31.9.197`
- Web interface shows "Cannot GET /" error
- Need to rebuild container with updated files

---

## Solution (Run on Linux Host)

### **Step 1: SSH to Linux**
```bash
ssh user@172.31.9.197
```

### **Step 2: Navigate to Ldap Directory**
```bash
cd /path/to/Ldap
# (wherever you have the project on Linux)
```

### **Step 3: Rebuild Container**
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
docker-compose logs -f
```

Press `Ctrl+C` after seeing:
- "LDAP Server listening at ldap://localhost:1389"
- "Web Interface listening at http://localhost:3000"

### **Step 4: Test**
From Windows browser: `http://172.31.9.197:3000`

---

## Transfer Updated Files to Linux

You need to copy these updated files from Windows to Linux:

### **Files to Transfer:**
- ✅ `docker-compose.yml` (updated with public volume mount)
- ✅ `users.json` (includes salesuser1, salesuser2, SalesUserGroup)
- ✅ `public/` directory (if missing)

### **Method 1: SCP from Windows PowerShell**

```powershell
cd C:\Users\Administrator\Desktop\Drive\Ldap

scp docker-compose.yml user@172.31.9.197:/path/to/Ldap/
scp users.json user@172.31.9.197:/path/to/Ldap/
scp -r public user@172.31.9.197:/path/to/Ldap/
```

### **Method 2: WinSCP / FileZilla**
1. Connect to `172.31.9.197`
2. Upload files to Ldap directory

---

## Verify on Linux

```bash
# Check files exist
ls -la /path/to/Ldap/
ls -la /path/to/Ldap/public/

# Check docker-compose.yml has public mount
cat docker-compose.yml | grep public

# Should show:
#   - ./public:/app/public
```

---

## After Rebuild - Verify

```bash
# Container running?
docker-compose ps

# Files in container?
docker-compose exec web-ldap ls -la /app/public

# Should show:
# index.html
# style.css
# app.js
```

---

## Splunk Configuration

Once working, configure Splunk with:

| Setting | Value |
|---------|-------|
| **Host** | `172.31.9.197` |
| **Port** | `1389` |
| **Bind DN** | `cn=ldapadmin,ou=users,o=splunk` |
| **Bind Password** | `password` |
| **User Base DN** | `o=splunk` |
| **User Name Attribute** | `uid` |

---

## Test Users

| Username | Password | Group |
|----------|----------|-------|
| ldapadmin | password | SplunkAdmins |
| salesuser1 | password123 | SalesUserGroup |
| salesuser2 | password123 | SalesUserGroup |

---

## Troubleshooting

**Still getting "Cannot GET /"?**

```bash
# Check logs
docker-compose logs web-ldap

# Check if public files exist in container
docker-compose exec web-ldap ls /app/public

# Rebuild with verbose output
docker-compose build --no-cache --progress=plain
```

**Can't connect from Windows?**

```bash
# Check firewall on Linux
sudo ufw status
sudo ufw allow 3000/tcp
sudo ufw allow 1389/tcp

# Test locally on Linux first
curl http://localhost:3000
```

---

For detailed guide, see: **LINUX_DOCKER_GUIDE.md**
