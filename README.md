# Web-Based LDAP Server for Splunk

This is a lightweight, web-based LDAP server designed for testing Splunk LDAP configuration and authentication. It includes a modern web interface to manage users.

## Prerequisites

- **Node.js**: You must have Node.js installed on your system. [Download Node.js](https://nodejs.org/)

## Installation

1.  Open a terminal in this directory.
2.  Install dependencies:
    ```bash
    npm install
    ```

## Running the Server

Start the server with:

```bash
npm start
```

This will start two services:
- **Web Interface**: [http://localhost:3000](http://localhost:3000)
- **LDAP Server**: `ldap://localhost:1389`

## Splunk Configuration

Configure your Splunk Authentication with the following settings:

- **Host**: `localhost`
- **Port**: `1389`
- **Bind DN**: `cn=admin,ou=users,o=splunk`
- **Bind Password**: `password`
- **User Base DN**: `ou=users,o=splunk` (or just `o=splunk`)
- **User Name Attribute**: `uid`
- **Real Name Attribute**: `cn`
- **Email Attribute**: `mail`

## Default Users

- **Admin**:
    - UID: `admin`
    - Password: `password`
    - DN: `cn=admin,ou=users,o=splunk`

You can add more users via the Web Interface.
