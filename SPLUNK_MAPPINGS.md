# Splunk LDAP Integration Settings

## Connection Settings
- **Strategy Name**: `LocalLDAP`
- **Host**: `172.31.9.197`
- **Port**: `1389`
- **Bind DN**: `cn=ldapadmin,ou=users,o=splunk`
- **Bind Password**: `password`

## User Settings
- **User Base DN**: `o=splunk`
- **User Name Attribute**: `uid`
- **Real Name Attribute**: `cn`
- **Email Attribute**: `mail`

## Group Settings
- **Group Base DN**: `o=splunk`
- **Group Base Filter**: `(objectClass=groupOfNames)`
- **Static Member Attribute**: `member`
- **Group Name Attribute**: `cn`

## Group Mappings
- `SalesUserGroup` -> `user` role
- `SplunkAdmins` -> `admin` role
- `SplunkPowerUsers` -> `power` role
- `SplunkUsers` -> `user` role

## Test Credentials
- **Sales User 1**: `salesuser1` / `password123`
- **Sales User 2**: `salesuser2` / `password123`
- **LDAP Admin**: `ldapadmin` / `password`
