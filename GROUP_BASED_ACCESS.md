# Group-Based LDAP Authentication - Complete Guide

## Overview

This guide demonstrates **automatic user access** to Splunk based on LDAP group membership. When you add a user to an LDAP group, they automatically get access to Splunk with the appropriate role - **no manual configuration needed in Splunk**.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Add User to LDAP Group                             │
│  ─────────────────────────────────                          │
│  Command: manage_groups.bat alice.johnson SplunkUsers       │
│                                                              │
│  ┌──────────────┐                                           │
│  │ LDAP Server  │                                           │
│  │              │                                           │
│  │ SplunkUsers  │ ◀── alice.johnson added                   │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Automatic Mapping
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: User Logs into Splunk                              │
│  ──────────────────────────────                             │
│  Username: alice.johnson                                    │
│  Password: password123                                      │
│                                                              │
│  ┌──────────────┐                                           │
│  │   Splunk     │                                           │
│  │              │                                           │
│  │ Grants 'user'│ ◀── Automatic role assignment             │
│  │ role access  │                                           │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

**Result**: Alice can immediately login to Splunk with 'user' role permissions!

---

## Current Group → Role Mapping

| LDAP Group | Splunk Role | Permissions | Current Members |
|------------|-------------|-------------|-----------------|
| **SplunkAdmins** | admin | Full administrative access | ldapadmin |
| **SplunkPowerUsers** | power | Advanced search, create dashboards | john.doe |
| **SplunkUsers** | user | Basic search and view | jane.smith, bob.wilson |

---

## Method 1: Add Users via Command Line (Recommended)

### Add User to Group

Open Command Prompt in the Ldap folder and run:

```batch
manage_groups.bat [username] [groupname]
```

**Examples:**

```batch
# Give alice.johnson basic user access
manage_groups.bat alice.johnson SplunkUsers

# Give charlie.brown power user access
manage_groups.bat charlie.brown SplunkPowerUsers

# Give david.lee admin access
manage_groups.bat david.lee SplunkAdmins
```

### Remove User from Group

```batch
manage_groups.bat [username] [groupname] remove
```

**Example:**

```batch
# Remove bob.wilson from SplunkUsers
manage_groups.bat bob.wilson SplunkUsers remove
```

---

## Method 2: Manually Edit users.json

### Add User to Group

1. Open `users.json` in a text editor
2. Find the group you want to add the user to (e.g., `SplunkUsers`)
3. Add the user's DN to the `member` array:

**Before:**
```json
{
    "dn": "cn=SplunkUsers,o=splunk",
    "objectclass": ["top", "groupOfNames"],
    "cn": "SplunkUsers",
    "member": [
        "cn=jane.smith,ou=users,o=splunk",
        "cn=bob.wilson,ou=users,o=splunk"
    ]
}
```

**After:**
```json
{
    "dn": "cn=SplunkUsers,o=splunk",
    "objectclass": ["top", "groupOfNames"],
    "cn": "SplunkUsers",
    "member": [
        "cn=jane.smith,ou=users,o=splunk",
        "cn=bob.wilson,ou=users,o=splunk",
        "cn=alice.johnson,ou=users,o=splunk"
    ]
}
```

4. Save the file
5. **Important**: Restart the LDAP server (close and reopen `run_portable.bat`)

---

## Testing Automatic Access

### Scenario: New Employee Joins Company

**Step 1: Create User in LDAP**

Via Web UI (http://localhost:3000):
- Common Name: `alice.johnson`
- Username: `alice.johnson`
- Email: `alice.johnson@example.com`
- Password: `password123`

**Step 2: Add to Appropriate Group**

```batch
manage_groups.bat alice.johnson SplunkUsers
```

**Step 3: User Logs into Splunk**

1. User goes to Splunk login page
2. Enters credentials:
   - Username: `alice.johnson`
   - Password: `password123`
3. **Automatic Result**: 
   - ✅ Login successful
   - ✅ Automatically assigned 'user' role
   - ✅ Can access Splunk immediately
   - ✅ No manual configuration needed in Splunk!

---

## Changing User Access Levels

### Promote User to Power User

```batch
# Remove from basic users
manage_groups.bat alice.johnson SplunkUsers remove

# Add to power users
manage_groups.bat alice.johnson SplunkPowerUsers
```

Next time Alice logs in, she'll have **power user** access!

### Promote User to Admin

```batch
# Remove from current group
manage_groups.bat alice.johnson SplunkPowerUsers remove

# Add to admins
manage_groups.bat alice.johnson SplunkAdmins
```

Next time Alice logs in, she'll have **admin** access!

---

## Verifying Group Membership in Splunk

After a user logs in, verify their role assignment:

1. Login to Splunk as admin
2. Go to **Settings** → **Users and authentication** → **Users**
3. Find the user (e.g., `alice.johnson`)
4. Click on the username
5. Check the **Roles** section - should show the mapped role

---

## Troubleshooting

### User Added to Group But Can't Login

**Check 1: Verify Group Membership**
```batch
# View current users.json
type users.json
```

**Check 2: Restart LDAP Server**
- Close the LDAP server terminal window
- Run `run_portable.bat` again

**Check 3: Verify Splunk Group Mapping**
1. Go to Splunk: **Settings** → **Authentication method** → **LDAP**
2. Click **Map groups** for your LocalLDAP strategy
3. Verify all three groups are mapped:
   - SplunkAdmins → admin
   - SplunkPowerUsers → power
   - SplunkUsers → user

### User Has Wrong Role

**Solution**: Check which group they're in
- Users can only be in ONE group at a time for proper role assignment
- If in multiple groups, Splunk may assign multiple roles

**Fix**:
```batch
# Remove from wrong group
manage_groups.bat username WrongGroup remove

# Add to correct group
manage_groups.bat username CorrectGroup
```

### Changes Not Taking Effect

**Solution**: Clear Splunk's LDAP cache
1. In Splunk, go to **Settings** → **Authentication method**
2. Click **Reload** next to your LDAP strategy
3. Or restart Splunk

---

## Best Practices

### 1. One User, One Group
- Assign each user to only ONE Splunk group
- This ensures clear role assignment
- Prevents conflicting permissions

### 2. Group Naming Convention
- Use descriptive names: `SplunkAdmins`, `SplunkPowerUsers`, `SplunkUsers`
- Match your organization's structure

### 3. Regular Audits
- Periodically review group memberships
- Remove users who no longer need access

### 4. Test Before Production
- Test new users in a non-production environment first
- Verify role assignments are correct

---

## Quick Reference Commands

```batch
# Add user to basic users group
manage_groups.bat username SplunkUsers

# Add user to power users group
manage_groups.bat username SplunkPowerUsers

# Add user to admins group
manage_groups.bat username SplunkAdmins

# Remove user from any group
manage_groups.bat username GroupName remove

# View help
manage_groups.bat
```

---

## Example Workflow: Onboarding New Employee

```batch
# 1. Create user via web UI (http://localhost:3000)
#    or they may already exist in your LDAP

# 2. Determine appropriate access level
#    - Basic user? → SplunkUsers
#    - Power user? → SplunkPowerUsers
#    - Admin? → SplunkAdmins

# 3. Add to group
manage_groups.bat newemployee SplunkUsers

# 4. Inform user of credentials
#    Username: newemployee
#    Password: (their LDAP password)
#    Splunk URL: http://your-splunk-server:8000

# 5. User logs in - automatic access granted!
```

---

## Summary

✅ **No manual user creation in Splunk needed**  
✅ **Add user to LDAP group → Automatic Splunk access**  
✅ **Change group → Automatic role change**  
✅ **Remove from group → Access revoked**  
✅ **Centralized user management in LDAP**

This is the power of group-based LDAP authentication!
