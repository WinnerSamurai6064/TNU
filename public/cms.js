// Check auth state on load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('trey_cms_token');
    if (token) {
        showDashboard();
    }
});

// --- Authentication ---
async function login() {
    const passcode = document.getElementById('cms-passcode').value;
    const errorEl = document.getElementById('login-error');
    
    try {
        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', passcode })
        });
        
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('trey_cms_token', data.token);
            showDashboard();
        } else {
            errorEl.innerText = data.error;
            errorEl.classList.remove('hidden');
        }
    } catch (err) {
        errorEl.innerText = "Network error. Serverless offline?";
        errorEl.classList.remove('hidden');
    }
}

function logout() {
    localStorage.removeItem('trey_cms_token');
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('cms-passcode').value = '';
}

function showDashboard() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    loadManagePosts();
}

// --- Key Management ---
async function changeKey() {
    const newKey = document.getElementById('new-cms-key').value;
    const msgEl = document.getElementById('key-msg');
    const token = localStorage.getItem('trey_cms_token');

    if (!newKey) return;

    try {
        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'change_key', new_passcode: newKey, token })
        });
        
        const data = await res.json();
        msgEl.innerText = res.ok ? "Key Updated. Use next login." : data.error;
        msgEl.className = res.ok ? "text-green-500 text-xs mt-2 text-center" : "text-red-500 text-xs mt-2 text-center";
        document.getElementById('new-cms-key').value = '';
    } catch (err) {
        msgEl.innerText = "Error updating key.";
        msgEl.className = "text-red-500 text-xs mt-2 text-center";
    }
}

// --- Content Management (CRUD) ---

// Helper to convert File to Base64 for Neon DB storage
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

async function createPost() {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const fileInput = document.getElementById('post-image');
    const msgEl = document.getElementById('publish-msg');
    const token = localStorage.getItem('trey_cms_token');

    if (!title || !content) {
        msgEl.innerText = "Headline and body required.";
        msgEl.className = "text-red-500 text-xs mt-2 text-center";
        return;
    }

    msgEl.innerText = "Processing...";
    msgEl.className = "text-white text-xs mt-2 text-center";

    let image_data = null;
    if (fileInput.files.length > 0) {
        image_data = await toBase64(fileInput.files[0]);
    }

    try {
        const res = await fetch('/api/posts', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, content, image_data })
        });

        if (res.ok) {
            msgEl.innerText = "Published successfully.";
            msgEl.className = "text-green-500 text-xs mt-2 text-center";
            document.getElementById('post-title').value = '';
            document.getElementById('post-content').value = '';
            fileInput.value = '';
            loadManagePosts(); // Refresh list
        } else {
            const data = await res.json();
            msgEl.innerText = data.error || "Failed to publish.";
            msgEl.className = "text-red-500 text-xs mt-2 text-center";
            if(res.status === 401 || res.status === 403) logout(); // Kick if token invalid
        }
    } catch (err) {
        msgEl.innerText = "Network error.";
        msgEl.className = "text-red-500 text-xs mt-2 text-center";
    }
}

async function loadManagePosts() {
    const listEl = document.getElementById('cms-posts-list');
    listEl.innerHTML = '<p class="text-white text-sm">Loading records...</p>';

    try {
        const res = await fetch('/api/posts');
        const posts = await res.json();

        if (posts.length === 0) {
            listEl.innerHTML = '<p class="text-gray-500 text-sm italic">Database empty.</p>';
            return;
        }

        listEl.innerHTML = posts.map(post => `
            <div class="bg-black/30 border border-white/10 rounded p-4 flex justify-between items-center group hover:border-red-500/50 transition">
                <div class="truncate pr-4">
                    <h4 class="text-white font-bold truncate">${post.title}</h4>
                    <p class="text-xs text-gray-500">${new Date(post.created_at).toLocaleDateString()}</p>
                </div>
                <button onclick="deletePost(${post.id})" class="text-xs bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white px-3 py-1 rounded transition border border-red-500/30">DELETE</button>
            </div>
        `).join('');
    } catch (err) {
        listEl.innerHTML = '<p class="text-red-500 text-sm">Error pulling records.</p>';
    }
}

async function deletePost(id) {
    if (!confirm('Permanently delete this record?')) return;

    const token = localStorage.getItem('trey_cms_token');
    try {
        const res = await fetch('/api/posts', {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ id })
        });

        if (res.ok) {
            loadManagePosts(); // Refresh list
        } else {
            if(res.status === 401 || res.status === 403) logout();
            alert("Failed to delete. Check console.");
        }
    } catch (err) {
        alert("Network error on delete.");
    }
}
