# Automatic LDAP User Access in Splunk (Without Group Mapping)

## Overview

This guide shows how to configure Splunk so that **any user in LDAP can automatically login** without needing to:
- Manually create users in Splunk
- Map LDAP groups
- Pre-configure individual users

**Result**: User exists in LDAP → User can login to Splunk automatically!

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  LDAP Server                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Users in LDAP:                                     │   │
│  │  - ldapadmin                                        │   │
│  │  - john.doe                                         │   │
│  │  - jane.smith                                       │   │
│  │  - bob.wilson                                       │   │
│  │  - (any new user you add)                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ User attempts login
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Splunk Authentication                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  1. Splunk checks LDAP for user                     │   │
│  │  2. If user exists in LDAP → Authenticate           │   │
│  │  3. Auto-create user in Splunk (first login)        │   │
│  │  4. Assign default role (e.g., 'user')              │   │
│  │  5. Grant access ✅                                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Configuration in Splunk UI

### **STEP 1: Start LDAP Server**

1. Go to folder: `c:\Users\Administrator\Desktop\Drive\Ldap`
2. Double-click `run_portable.bat`
3. Keep terminal window open

---

### **STEP 2: Access Splunk Web Interface**

1. Open browser → `http://localhost:8000`
2. Login with Splunk admin credentials
3. Navigate to: **Settings** → **Users and authentication** → **Authentication method**

---

### **STEP 3: Configure LDAP Strategy**

1. Click **LDAP** under External authentication
2. Click **Configure Splunk to use LDAP**
3. Click **New** to create new strategy

#### **Connection Settings**

| Field | Value |
|-------|-------|
| **Strategy name** | `LocalLDAP` |
| **Host** | `localhost` |
| **Port** | `1389` |
| **SSL enabled** | ☐ Unchecked |
| **Bind DN** | `cn=ldapadmin,ou=users,o=splunk` |
| **Bind DN password** | `password` |

Click **Next**

---

### **STEP 4: User Settings**

| Field | Value |
|-------|-------|
| **User base DN** | `o=splunk` |
| **User base filter** | Leave empty |
| **User name attribute** | `uid` |
| **Real name attribute** | `cn` |
| **Email attribute** | `mail` |

Click **Next**

---

### **STEP 5: Group Settings** ⭐ **SKIP GROUP MAPPING**

Since you don't have groups configured, you can:

**Option A: Leave all fields empty**
- Just click **Next** or **Save**

**Option B: Fill minimal values (Splunk may require)**
| Field | Value |
|-------|-------|
| **Group base DN** | `o=splunk` |
| **Static member attribute** | `member` |
| **Group name attribute** | `cn` |

**Important**: Don't worry about mapping groups - we'll use default role assignment instead.

Click **Save**

---

### **STEP 6: Configure Default Role for LDAP Users** ⭐ **KEY STEP**

This is how users get automatic access without group mapping:

1. Go to **Settings** → **Access controls** → **Authentication method**
2. Scroll down to **LDAP settings** section
3. Find **Default roles for new users**
4. Select a default role that all LDAP users will get:
   - **user** (recommended for basic access)
   - **power** (if you want all users to have advanced access)
   - Or create a custom role

**Alternative Method** (if above option not visible):

1. Go to **Settings** → **Users and authentication** → **Roles**
2. Click **New Role** 
3. Create a role called `ldap_default_role`
4. Set permissions as needed
5. Go back to **Authentication method** → **LDAP**
6. Edit your strategy
7. Look for **Role mapping** or **Default role** setting
8. Set to `ldap_default_role`

---

### **STEP 7: Enable Auto-Creation of Users**

1. Still in **Settings** → **Access controls** → **Authentication method**
2. Find the LDAP configuration section
3. Ensure these settings:
   - ☑ **Map users to roles automatically** (if available)
   - ☑ **Create users from LDAP automatically** (if available)

**If these options are not visible**, Splunk will auto-create users by default when they login via LDAP.

---

### **STEP 8: Enable LDAP Authentication**

1. In **Authentication method** page
2. Under **Authentication type**:
   - ☑ **Splunk** (keep for fallback)
   - ☑ **LDAP** (enable this)
3. **Authentication order**: `LDAP, Splunk`
4. Click **Save**

---

### **STEP 9: Test Automatic User Access**

#### **Test with Existing User**

1. Logout from Splunk
2. Login with any LDAP user:
   - Username: `ldapadmin`
   - Password: `password`
3. ✅ **Expected**: Login successful

#### **Verify User Was Auto-Created**

1. Login as Splunk admin
2. Go to **Settings** → **Users and authentication** → **Users**
3. You should see `ldapadmin` in the user list
4. Click on the username
5. Verify:
   - **Authentication type**: LDAP
   - **Roles**: Should show the default role you configured

---

### **STEP 10: Add New User to LDAP - Automatic Access**

#### **Add User via Web UI**

1. Open browser to `http://localhost:3000`
2. Click **Add User**
3. Fill in:
   - **Common Name**: `alice.johnson`
   - **Username**: `alice.johnson`
   - **Surname**: `Johnson`
   - **Email**: `alice.johnson@example.com`
   - **Password**: `password123`
4. Click **Add User**

#### **User Logs into Splunk**

1. User goes to Splunk login page
2. Enters credentials:
   - Username: `alice.johnson`
   - Password: `password123`
3. ✅ **Automatic Result**:
   - User is authenticated via LDAP
   - User account auto-created in Splunk
   - Default role assigned
   - Access granted immediately!

---

## Managing User Roles After Creation

Since all users get the same default role initially, you can adjust individual user roles after their first login:

### **Change User Role**

1. Go to **Settings** → **Users and authentication** → **Users**
2. Find the user (e.g., `alice.johnson`)
3. Click **Edit** next to the username
4. In **Roles** section:
   - ☐ Uncheck `user` (if that was default)
   - ☑ Check `admin` (to make them admin)
   - ☑ Check `power` (to make them power user)
5. Click **Save**

**Next time the user logs in**, they'll have the updated role!

---

## Configuration for Different User Access Levels

### **Scenario 1: All Users Get Basic Access**

**Default Role**: `user`

- All LDAP users can login
- All get basic search/view access
- Manually promote specific users to admin/power as needed

### **Scenario 2: All Users Get Power Access**

**Default Role**: `power`

- All LDAP users can login
- All get advanced capabilities
- Manually promote specific users to admin
- Manually demote users to basic `user` if needed

### **Scenario 3: Custom Default Role**

1. Create custom role: **Settings** → **Roles** → **New Role**
2. Name it: `ldap_users`
3. Set specific capabilities
4. Set as default role for LDAP authentication

---

## Current LDAP Users (from users.json)

| Username | Full Name | Email | Password |
|----------|-----------|-------|----------|
| `ldapadmin` | ldapadmin | ldapadmin@example.com | `password` |
| `john.doe` | John Doe | john.doe@example.com | `password123` |
| `jane.smith` | Jane Smith | jane.smith@example.com | `password123` |
| `bob.wilson` | Bob Wilson | bob.wilson@example.com | `password123` |

**All of these users can login to Splunk automatically!**

---

## Adding New Users

### **Method 1: Web UI** (Easiest)

1. Go to `http://localhost:3000`
2. Click **Add User**
3. Fill in user details
4. User can immediately login to Splunk

### **Method 2: Edit users.json**

Add new user entry:

```json
{
    "dn": "cn=newuser,ou=users,o=splunk",
    "objectclass": ["top", "person", "organizationalPerson", "inetOrgPerson"],
    "cn": "New User",
    "sn": "User",
    "mail": "newuser@example.com",
    "userPassword": "password123",
    "uid": "newuser"
}
```

Restart LDAP server after editing.

---

## Troubleshooting

### **User Can't Login**

**Check 1: Verify user exists in LDAP**
- Go to `http://localhost:3000`
- Check if user is listed

**Check 2: Verify LDAP server is running**
- Check if terminal window with LDAP server is still open
- If closed, run `run_portable.bat` again

**Check 3: Check Splunk logs**
```
Settings → System → Distributed search
Search: index=_internal source=*splunkd.log* LDAP
```

### **User Logs In But Has No Access**

**Solution**: Assign a role manually
1. **Settings** → **Users** → Find user → **Edit**
2. Check at least one role (e.g., `user`)
3. Save

### **Want to Prevent Certain LDAP Users from Accessing Splunk**

**Option 1**: Remove user from LDAP

**Option 2**: Lock user in Splunk
1. **Settings** → **Users** → Find user → **Edit**
2. Check **Lock this user account**
3. Save

---

## Summary

✅ **No group mapping required**  
✅ **Any LDAP user can login automatically**  
✅ **Users auto-created on first login**  
✅ **Default role assigned automatically**  
✅ **Adjust individual user roles as needed**  
✅ **Add new user to LDAP → Immediate Splunk access**

---

## Quick Configuration Reference

| Setting | Value |
|---------|-------|
| **Host** | `localhost` |
| **Port** | `1389` |
| **Bind DN** | `cn=ldapadmin,ou=users,o=splunk` |
| **Bind Password** | `password` |
| **User Base DN** | `o=splunk` |
| **User Name Attribute** | `uid` |
| **Real Name Attribute** | `cn` |
| **Email Attribute** | `mail` |
| **Default Role** | `user` (or your choice) |
| **Auto-create users** | ✅ Enabled |
