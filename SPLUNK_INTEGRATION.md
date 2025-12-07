# Splunk LDAP Integration Guide

Follow these steps to configure Splunk to authenticate users against your local Web-Based LDAP Server.

## 1. Start the LDAP Server
Ensure your local LDAP server is running.
1. Go to your `Ldap` folder.
2. Double-click `run_portable.bat`.
3. Keep this window open.

## 2. Open Splunk Web
1. Log in to your Splunk instance as an administrator.
2. Navigate to **Settings** > **Users and Authentication** > **Authentication Methods**.

## 3. Configure LDAP Strategy
1. Under **External authentication**, click **LDAP**.
2. Click **Configure Splunk to use LDAP**.
3. On the "LDAP strategies" page, click **New**.

### Step A: LDAP Strategy Configuration
Fill in the following details:

| Field | Value | Description |
| :--- | :--- | :--- |
| **Strategy Name** | `LocalLDAP` | Any name you like. |
| **Host** | `localhost` | The address of your LDAP server. |
| **Port** | `1389` | The port our server is listening on. |
| **Bind DN** | `cn=admin,ou=users,o=splunk` | The user Splunk uses to search the directory. |
| **Bind Password** | `password` | The password for the Bind DN. |

*Note: If Splunk is running in a container or VM, `localhost` might not work. Use your host machine's IP address instead.*

### Step B: User Settings
Click on the **User Settings** section (or "Next") and configure:

| Field | Value | Description |
| :--- | :--- | :--- |
| **User Base DN** | `o=splunk` | The root of the directory to search for users. |
| **User Name Attribute** | `uid` | The attribute used for login (e.g., `admin`). |
| **Real Name Attribute** | `cn` | The attribute for the user's full name. |
| **Email Attribute** | `mail` | The attribute for the user's email. |

### Step C: Group Settings
For this simple server, we are not using dynamic groups, but you can fill these in to satisfy the form:

| Field | Value |
| :--- | :--- |
| **Group Base DN** | `o=splunk` |
| **Static Member Attribute** | `dn` |
| **Group Name Attribute** | `cn` |

4. Click **Save**.

## 4. Map LDAP Groups to Splunk Roles
1. Go to **Settings** > **Users and Authentication** > **Authentication Methods**.
2. Click **LDAP settings** (if not already there).
3. Click **Map groups** for your `LocalLDAP` strategy.
4. Search for groups. Since our simple server doesn't strictly enforce group objects, you might not see groups here unless you create an entry with `objectclass=groupOfNames`.
   * *Workaround*: If you just want to test login, you can often skip this or map a dummy group if one appears.
   * *Alternative*: Create a user in the Web UI, then try to log in. Splunk often requires a user to be mapped to a role.
   * **Crucial Step**: If you cannot map groups, you can manually assign a role to an LDAP user *after* they have logged in once, or pre-create the user in Splunk with the same username and select "LDAP" as the authentication source.

## 5. Test Login
1. Open a new browser (incognito mode).
2. Go to your Splunk login page.
3. Enter the credentials of a user in your LDAP server:
   * **Username**: `admin`
   * **Password**: `password`
4. If successful, you are now authenticated via LDAP!

## Troubleshooting
- **Connection Refused**: Ensure the black terminal window for the LDAP server is still open.
- **Invalid Credentials**: Double-check the Bind DN and Password.
- **User Not Found**: Ensure the "User Base DN" is set to `o=splunk`.
