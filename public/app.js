const API_URL = '/api/users';
const GROUPS_API_URL = '/api/groups';
const userList = document.getElementById('user-list');
const groupList = document.getElementById('group-list');
const userCount = document.getElementById('user-count');
const groupCount = document.getElementById('group-count');
const modal = document.getElementById('user-modal');
const groupModal = document.getElementById('group-modal');
const btnAddUser = document.getElementById('btn-add-user');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCloseGroupModal = document.getElementById('btn-close-group-modal');
const btnCancel = document.getElementById('btn-cancel');
const userForm = document.getElementById('user-form');
const modalTitle = document.getElementById('modal-title');
const editModeInput = document.getElementById('edit-mode');

// State
let users = [];
let groups = [];

// Fetch Users
async function fetchUsers() {
    try {
        const res = await fetch(API_URL);
        users = await res.json();
        renderUsers();
    } catch (err) {
        console.error('Failed to fetch users', err);
    }
}

// Fetch Groups
async function fetchGroups() {
    try {
        const res = await fetch(GROUPS_API_URL);
        groups = await res.json();
        renderGroups();
    } catch (err) {
        console.error('Failed to fetch groups', err);
    }
}

// Render Users
function renderUsers() {
    userList.innerHTML = '';
    userCount.textContent = users.length;

    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.uid}</td>
            <td>${user.cn}</td>
            <td>${user.mail}</td>
            <td class="actions-cell">
                <button class="btn secondary" onclick="editUser('${user.uid}')">Edit</button>
                <button class="btn danger" onclick="deleteUser('${user.uid}')">Delete</button>
            </td>
        `;
        userList.appendChild(tr);
    });
}

// Render Groups
function renderGroups() {
    groupList.innerHTML = '';
    groupCount.textContent = groups.length;

    if (groups.length === 0) {
        groupList.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No groups found</td></tr>';
        return;
    }

    groups.forEach(group => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="group-badge">${group.cn}</span></td>
            <td>${group.description || '-'}</td>
            <td>${group.memberCount || 0} member(s)</td>
            <td class="actions-cell">
                <button class="btn secondary" onclick="viewGroupMembers('${group.cn}')">View Members</button>
            </td>
        `;
        groupList.appendChild(tr);
    });
}

// View Group Members
window.viewGroupMembers = async (groupName) => {
    try {
        const res = await fetch(`${GROUPS_API_URL}/${groupName}/members`);
        const data = await res.json();

        const groupModalTitle = document.getElementById('group-modal-title');
        const groupMembersContent = document.getElementById('group-members-content');

        groupModalTitle.textContent = `${data.group} - Members`;

        if (data.members.length === 0) {
            groupMembersContent.innerHTML = '<p style="color: var(--text-secondary);">No members in this group</p>';
        } else {
            let membersHTML = '<div class="member-list">';
            data.members.forEach(member => {
                if (member.notFound) {
                    membersHTML += `
                        <div class="member-item">
                            <div class="member-info">
                                <span class="member-uid" style="color: var(--danger);">⚠️ ${member.dn}</span>
                                <span class="member-cn">User not found</span>
                            </div>
                        </div>
                    `;
                } else {
                    membersHTML += `
                        <div class="member-item">
                            <div class="member-info">
                                <span class="member-uid">${member.uid}</span>
                                <span class="member-cn">${member.cn} (${member.mail})</span>
                            </div>
                        </div>
                    `;
                }
            });
            membersHTML += '</div>';
            groupMembersContent.innerHTML = membersHTML;
        }

        groupModal.classList.remove('hidden');
    } catch (err) {
        console.error('Failed to fetch group members', err);
        alert('Failed to load group members');
    }
};

// Add/Edit User
userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(userForm);
    const data = Object.fromEntries(formData.entries());
    const isEdit = editModeInput.value === 'true';

    // If password is empty in edit mode, remove it so we don't overwrite with empty
    if (isEdit && !data.password) {
        delete data.password;
    }

    try {
        const url = isEdit ? `${API_URL}/${data.uid}` : API_URL;
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            closeModal();
            fetchUsers();
            fetchGroups(); // Refresh groups in case user was added
        } else {
            const err = await res.json();
            alert(err.error || 'Operation failed');
        }
    } catch (err) {
        console.error(err);
        alert('Error saving user');
    }
});

// Delete User
window.deleteUser = async (uid) => {
    if (!confirm(`Are you sure you want to delete user ${uid}?`)) return;

    try {
        const res = await fetch(`${API_URL}/${uid}`, { method: 'DELETE' });
        if (res.ok) {
            fetchUsers();
            fetchGroups(); // Refresh groups in case user was in a group
        } else {
            alert('Failed to delete user');
        }
    } catch (err) {
        console.error(err);
    }
};

// Edit User Setup
window.editUser = (uid) => {
    const user = users.find(u => u.uid === uid);
    if (!user) return;

    document.getElementById('uid').value = user.uid;
    document.getElementById('uid').readOnly = true; // Cannot change UID
    document.getElementById('cn').value = user.cn;
    document.getElementById('sn').value = user.sn || '';
    document.getElementById('mail').value = user.mail;
    document.getElementById('password').value = ''; // Don't show password

    editModeInput.value = 'true';
    modalTitle.textContent = 'Edit User';
    openModal();
};

// Modal Logic
function openModal() {
    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
    userForm.reset();
    editModeInput.value = 'false';
    modalTitle.textContent = 'Add User';
    document.getElementById('uid').readOnly = false;
}

function closeGroupModal() {
    groupModal.classList.add('hidden');
}

// Tab Switching
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');

        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Load data if switching to groups tab
        if (tabName === 'groups' && groups.length === 0) {
            fetchGroups();
        }
    });
});

// Event Listeners
btnAddUser.addEventListener('click', openModal);
btnCloseModal.addEventListener('click', closeModal);
btnCloseGroupModal.addEventListener('click', closeGroupModal);
btnCancel.addEventListener('click', closeModal);

// Initial Load
fetchUsers();
fetchGroups();

