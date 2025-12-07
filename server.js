const ldap = require('ldapjs');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const ldapServer = ldap.createServer();
const PORT_WEB = 3000;
const PORT_LDAP = 1389;
const DB_FILE = path.join(__dirname, 'users.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// --- Data Management ---

function loadData() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading DB:", err);
        return [];
    }
}

function saveData(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// --- LDAP Server ---

const SUFFIX = 'o=splunk';

const normalizeDN = (dn) => dn.toLowerCase().replace(/\s+/g, '');

ldapServer.bind(SUFFIX, (req, res, next) => {
    const dn = req.dn.toString();
    const password = req.credentials;

    console.log(`LDAP Bind Request: ${dn}`);

    const entries = loadData();
    // Normalize both DNs to ignore spaces (e.g. "o=splunk" vs "o= splunk")
    const user = entries.find(e => normalizeDN(e.dn) === normalizeDN(dn));

    if (!user) {
        console.log('User not found');
        return next(new ldap.InvalidCredentialsError());
    }

    if (user.userPassword !== password) {
        console.log('Invalid password');
        return next(new ldap.InvalidCredentialsError());
    }

    console.log('Bind successful');
    res.end();
    return next();
});

ldapServer.search(SUFFIX, (req, res, next) => {
    const dn = req.dn.toString();
    console.log(`LDAP Search Request: ${dn} scope: ${req.scope} filter: ${req.filter.toString()}`);

    const entries = loadData();

    // Simple scope check: if base is o=splunk, we search everything.
    // If base is ou=users,o=splunk, we search users.
    // For simplicity, we just filter all entries that match the filter and are children of the base.

    entries.forEach(entry => {
        // Check if entry is under the base DN using normalized strings
        const entryDN = normalizeDN(entry.dn);
        const reqDN = normalizeDN(dn);
        const suffixDN = normalizeDN(SUFFIX);

        if (!entryDN.endsWith(reqDN) && reqDN !== suffixDN) {
            // This is a loose check. 
            // If search base is 'ou=users,o=splunk', entry 'cn=foo,ou=users,o=splunk' ends with it.
            return;
        }

        if (req.filter.matches(entry)) {
            res.send({
                dn: entry.dn,
                attributes: entry
            });
        }
    });

    res.end();
    return next();
});

// --- Web API ---

app.get('/api/users', (req, res) => {
    const entries = loadData();
    // Filter only users (heuristic: has uid)
    const users = entries.filter(e => e.objectclass.includes('person'));
    res.json(users);
});

app.post('/api/users', (req, res) => {
    const { cn, sn, mail, password, uid } = req.body;
    if (!cn || !uid) return res.status(400).json({ error: 'Missing fields' });

    const entries = loadData();
    const dn = `cn=${cn},ou=users,o=splunk`;

    if (entries.find(e => e.dn === dn)) {
        return res.status(409).json({ error: 'User already exists' });
    }

    const newUser = {
        dn,
        objectclass: ["top", "person", "organizationalPerson", "inetOrgPerson"],
        cn,
        sn: sn || cn,
        mail: mail || `${uid}@example.com`,
        userPassword: password || 'password',
        uid
    };

    entries.push(newUser);
    saveData(entries);
    res.json(newUser);
});

app.put('/api/users/:uid', (req, res) => {
    const { uid } = req.params;
    const updates = req.body;
    const entries = loadData();
    const idx = entries.findIndex(e => e.uid === uid);

    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    // Update fields (excluding DN/UID for simplicity in this demo)
    const user = entries[idx];
    if (updates.cn) user.cn = updates.cn;
    if (updates.sn) user.sn = updates.sn;
    if (updates.mail) user.mail = updates.mail;
    if (updates.password) user.userPassword = updates.password;

    // If CN changed, DN should change, but let's keep it simple and NOT change DN for now
    // or we have to re-index.

    entries[idx] = user;
    saveData(entries);
    res.json(user);
});

app.delete('/api/users/:uid', (req, res) => {
    const { uid } = req.params;
    let entries = loadData();
    const initialLength = entries.length;
    entries = entries.filter(e => e.uid !== uid);

    if (entries.length === initialLength) return res.status(404).json({ error: 'User not found' });

    saveData(entries);
    res.json({ success: true });
});

// --- Group API ---

app.get('/api/groups', (req, res) => {
    const entries = loadData();
    // Filter only groups (has groupOfNames objectclass)
    const groups = entries.filter(e => e.objectclass && e.objectclass.includes('groupOfNames'));

    // Add member count to each group
    const groupsWithCount = groups.map(g => ({
        ...g,
        memberCount: g.member ? g.member.length : 0
    }));

    res.json(groupsWithCount);
});

app.get('/api/groups/:name/members', (req, res) => {
    const { name } = req.params;
    const entries = loadData();

    // Find the group
    const group = entries.find(e =>
        e.cn === name && e.objectclass && e.objectclass.includes('groupOfNames')
    );

    if (!group) {
        return res.status(404).json({ error: 'Group not found' });
    }

    // Get member DNs
    const memberDNs = group.member || [];

    // Find user details for each member
    const members = memberDNs.map(memberDN => {
        const user = entries.find(e => e.dn === memberDN);
        return user || { dn: memberDN, notFound: true };
    });

    res.json({
        group: group.cn,
        description: group.description || '',
        members: members
    });
});

// --- Start Servers ---

ldapServer.listen(PORT_LDAP, () => {
    console.log(`LDAP Server listening at ldap://localhost:${PORT_LDAP}`);
});

app.listen(PORT_WEB, () => {
    console.log(`Web Interface listening at http://localhost:${PORT_WEB}`);
});
