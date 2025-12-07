# LDAP Groups - Active Directory Style Implementation

## Overview

Your LDAP server already supports groups similar to Windows Active Directory. This guide shows how to use and enhance group functionality.

---

## Current Group Implementation

### **Standard Groups (Like AD Security Groups)**

Your current groups use the `groupOfNames` object class, which is the LDAP standard equivalent to AD Security Groups.

**Example:**
```json
{
    "dn": "cn=SalesUserGroup,o=splunk",
    "objectclass": ["top", "groupOfNames"],
    "cn": "SalesUserGroup",
    "description": "Sales Team Users",
    "member": [
        "cn=salesuser1,ou=users,o=splunk",
        "cn=salesuser2,ou=users,o=splunk"
    ]
}
```

**How it works:**
- ✅ Group has a unique DN (Distinguished Name)
- ✅ Contains list of member DNs
- ✅ Splunk can query group membership
- ✅ Same concept as AD groups

---

## Group Features Comparison

| Feature | Windows AD | LDAP (Your Server) | Implementation |
|---------|-----------|-------------------|----------------|
| **Static Groups** | Security Groups | groupOfNames | ✅ **Already implemented** |
| **Group Membership** | member attribute | member attribute | ✅ **Already implemented** |
| **Group Description** | description | description | ✅ **Already implemented** |
| **Nested Groups** | Groups in groups | Supported | ⚠️ Can be added |
| **Dynamic Groups** | Dynamic membership | groupOfURLs | ⚠️ Can be added |
| **User's memberOf** | Automatic | Manual | ⚠️ Can be added |
| **Group Scope** | Domain/Global/Universal | N/A | Different concept |

---

## How to Use Groups with Splunk

### **Step 1: Create Groups in LDAP**

Groups are already created in `users.json`:
- SplunkAdmins
- SplunkPowerUsers
- SplunkUsers
- SalesUserGroup

### **Step 2: Map Groups to Splunk Roles**

In Splunk UI:

1. **Settings** → **Authentication method** → **LDAP**
2. Click **Map groups** for your LDAP strategy
3. Search for group: `SalesUserGroup`
4. Map to Splunk role: `user` (or `power`, `admin`)
5. Save

### **Step 3: Add Users to Groups**

**Method 1: Edit users.json**

Add user DN to the group's `member` array:

```json
{
    "dn": "cn=SalesUserGroup,o=splunk",
    "member": [
        "cn=salesuser1,ou=users,o=splunk",
        "cn=salesuser2,ou=users,o=splunk",
        "cn=newuser,ou=users,o=splunk"  // ← Add new user
    ]
}
```

**Method 2: Use the management script**

```bash
node add_user_to_group.js newuser SalesUserGroup
```

### **Step 4: User Gets Automatic Access**

When user logs into Splunk:
1. Splunk checks LDAP for user
2. Splunk finds user is member of SalesUserGroup
3. Splunk grants role mapped to SalesUserGroup
4. User gets access automatically!

---

## Advanced Group Scenarios

### **Scenario 1: Nested Groups (Groups within Groups)**

**Use Case**: You have regional sales teams that should all be part of a main sales group.

**Implementation:**

```json
// Regional group
{
    "dn": "cn=SalesWestRegion,o=splunk",
    "objectclass": ["top", "groupOfNames"],
    "cn": "SalesWestRegion",
    "member": [
        "cn=salesuser1,ou=users,o=splunk",
        "cn=salesuser2,ou=users,o=splunk"
    ]
},

// Regional group
{
    "dn": "cn=SalesEastRegion,o=splunk",
    "objectclass": ["top", "groupOfNames"],
    "cn": "SalesEastRegion",
    "member": [
        "cn=salesuser3,ou=users,o=splunk",
        "cn=salesuser4,ou=users,o=splunk"
    ]
},

// Parent group containing other groups
{
    "dn": "cn=AllSalesTeam,o=splunk",
    "objectclass": ["top", "groupOfNames"],
    "cn": "AllSalesTeam",
    "member": [
        "cn=SalesWestRegion,o=splunk",  // ← Group as member
        "cn=SalesEastRegion,o=splunk"   // ← Group as member
    ]
}
```

**In Splunk**: Map `AllSalesTeam` to a role, and all members of nested groups get access.

**Note**: Splunk must have "nested groups" enabled in LDAP settings.

---

### **Scenario 2: Multiple Groups per User**

**Use Case**: A user belongs to multiple groups (like AD).

**Implementation:**

```json
// User is in multiple groups
{
    "dn": "cn=SalesUserGroup,o=splunk",
    "member": [
        "cn=salesuser1,ou=users,o=splunk"
    ]
},
{
    "dn": "cn=MarketingTeam,o=splunk",
    "member": [
        "cn=salesuser1,ou=users,o=splunk"  // ← Same user
    ]
},
{
    "dn": "cn=Managers,o=splunk",
    "member": [
        "cn=salesuser1,ou=users,o=splunk"  // ← Same user again
    ]
}
```

**In Splunk**: User gets roles from ALL groups they're a member of.

---

### **Scenario 3: Department-Based Groups**

**Use Case**: Organize users by department like in AD.

**Implementation:**

```json
// IT Department
{
    "dn": "cn=IT-Department,o=splunk",
    "objectclass": ["top", "groupOfNames"],
    "cn": "IT-Department",
    "description": "IT Department - Full Admin Access",
    "member": [
        "cn=ldapadmin,ou=users,o=splunk",
        "cn=john.doe,ou=users,o=splunk"
    ]
},

// Sales Department
{
    "dn": "cn=Sales-Department,o=splunk",
    "objectclass": ["top", "groupOfNames"],
    "cn": "Sales-Department",
    "description": "Sales Department - User Access",
    "member": [
        "cn=salesuser1,ou=users,o=splunk",
        "cn=salesuser2,ou=users,o=splunk"
    ]
},

// HR Department
{
    "dn": "cn=HR-Department,o=splunk",
    "objectclass": ["top", "groupOfNames"],
    "cn": "HR-Department",
    "description": "HR Department - Power User Access",
    "member": [
        "cn=jane.smith,ou=users,o=splunk"
    ]
}
```

**In Splunk**: 
- Map `IT-Department` → `admin` role
- Map `Sales-Department` → `user` role
- Map `HR-Department` → `power` role

---

## Group Management Best Practices

### **1. Naming Convention**

Use clear, descriptive names:
- ✅ `Sales-Department`
- ✅ `IT-Admins`
- ✅ `Power-Users`
- ❌ `Group1`
- ❌ `Test`

### **2. Group Hierarchy**

Organize groups logically:
```
Company
├── Departments
│   ├── IT-Department
│   ├── Sales-Department
│   └── HR-Department
├── Roles
│   ├── Admins
│   ├── PowerUsers
│   └── Users
└── Projects
    ├── ProjectA-Team
    └── ProjectB-Team
```

### **3. Use Descriptions**

Always add descriptions to groups:
```json
{
    "description": "Sales Department - User Access to Splunk"
}
```

### **4. Regular Audits**

Periodically review:
- Who is in each group?
- Are group memberships still valid?
- Remove users who left the company

---

## Querying Groups (Like AD)

### **Find All Groups**

```bash
# Using ldapsearch (on Linux)
ldapsearch -x -H ldap://localhost:1389 -b "o=splunk" \
  -D "cn=ldapadmin,ou=users,o=splunk" -w password \
  "(objectClass=groupOfNames)" cn description
```

### **Find User's Groups**

```bash
# Find all groups that contain a specific user
ldapsearch -x -H ldap://localhost:1389 -b "o=splunk" \
  -D "cn=ldapadmin,ou=users,o=splunk" -w password \
  "(member=cn=salesuser1,ou=users,o=splunk)" cn
```

### **Find Group Members**

```bash
# List all members of a group
ldapsearch -x -H ldap://localhost:1389 -b "o=splunk" \
  -D "cn=ldapadmin,ou=users,o=splunk" -w password \
  "(cn=SalesUserGroup)" member
```

---

## Splunk Group Mapping Configuration

### **Enable Nested Groups in Splunk**

If you want nested groups to work:

1. **Settings** → **Authentication method** → **LDAP**
2. Edit your LDAP strategy
3. Go to **Group settings**
4. Enable: ☑ **Nested groups**
5. Set **Group search depth**: `3` (or higher)
6. Save

### **Group Search Filter**

For better performance, use specific filters:

```
(objectClass=groupOfNames)
```

This tells Splunk to only search for group objects.

---

## Summary

✅ **You already have AD-style groups** - using `groupOfNames` object class  
✅ **Group membership works** - users listed in `member` attribute  
✅ **Splunk can map groups to roles** - automatic access control  
✅ **Nested groups supported** - groups can contain other groups  
✅ **Multiple group membership** - users can be in many groups  
✅ **Same concepts as AD** - just different terminology  

**Your LDAP groups work exactly like Windows AD groups for Splunk integration!**
