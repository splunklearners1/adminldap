const fs = require('fs');
const path = require('path');

// Helper script to add a user to an LDAP group
// Usage: node add_user_to_group.js <username> <groupname>

const DB_FILE = path.join(__dirname, 'users.json');

function loadData() {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
}

function saveData(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4));
}

function addUserToGroup(username, groupName) {
    const entries = loadData();

    // Find user
    const user = entries.find(e => e.uid === username);
    if (!user) {
        console.error(`❌ User '${username}' not found!`);
        console.log('\nAvailable users:');
        entries.filter(e => e.uid).forEach(u => console.log(`  - ${u.uid} (${u.cn})`));
        return false;
    }

    // Find group
    const group = entries.find(e => e.cn === groupName && e.objectclass.includes('groupOfNames'));
    if (!group) {
        console.error(`❌ Group '${groupName}' not found!`);
        console.log('\nAvailable groups:');
        entries.filter(e => e.objectclass && e.objectclass.includes('groupOfNames')).forEach(g => console.log(`  - ${g.cn}`));
        return false;
    }

    // Check if user is already a member
    if (!group.member) {
        group.member = [];
    }

    if (group.member.includes(user.dn)) {
        console.log(`ℹ️  User '${username}' is already a member of '${groupName}'`);
        return true;
    }

    // Add user to group
    group.member.push(user.dn);
    saveData(entries);

    console.log(`✅ Successfully added '${username}' (${user.cn}) to group '${groupName}'`);
    console.log(`   User DN: ${user.dn}`);
    console.log(`   Group DN: ${group.dn}`);
    console.log(`\n📋 Current members of '${groupName}':`);
    group.member.forEach(m => console.log(`   - ${m}`));

    return true;
}

function removeUserFromGroup(username, groupName) {
    const entries = loadData();

    // Find user
    const user = entries.find(e => e.uid === username);
    if (!user) {
        console.error(`❌ User '${username}' not found!`);
        return false;
    }

    // Find group
    const group = entries.find(e => e.cn === groupName && e.objectclass.includes('groupOfNames'));
    if (!group) {
        console.error(`❌ Group '${groupName}' not found!`);
        return false;
    }

    // Remove user from group
    if (!group.member || !group.member.includes(user.dn)) {
        console.log(`ℹ️  User '${username}' is not a member of '${groupName}'`);
        return true;
    }

    group.member = group.member.filter(m => m !== user.dn);
    saveData(entries);

    console.log(`✅ Successfully removed '${username}' from group '${groupName}'`);
    return true;
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('Usage: node add_user_to_group.js <username> <groupname> [remove]');
    console.log('\nExamples:');
    console.log('  node add_user_to_group.js alice.johnson SplunkUsers');
    console.log('  node add_user_to_group.js john.doe SplunkAdmins');
    console.log('  node add_user_to_group.js bob.wilson SplunkPowerUsers remove');
    process.exit(1);
}

const username = args[0];
const groupName = args[1];
const isRemove = args[2] === 'remove';

if (isRemove) {
    removeUserFromGroup(username, groupName);
} else {
    addUserToGroup(username, groupName);
}
