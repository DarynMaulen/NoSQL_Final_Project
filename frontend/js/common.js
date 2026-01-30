const API_BASE = (window.__API_BASE__ = 'http://localhost:4000');

// API wrapper
async function apiFetch(path, { method = 'GET', body = null, headers = {} } = {}) {
    const token = localStorage.getItem('token');
    const opts = { method, headers: { ...headers } };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body !== null) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
    }
    const res = await fetch(API_BASE + path, opts);
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
    if (!res.ok) {
        const errMsg = data?.message || (data?.errors && data.errors.map(e => e.msg).join('; ')) || res.statusText;
        const err = new Error(errMsg);
        err.status = res.status;
        err.body = data;
        throw err;
    }
    return data;
}

// auth helpers
function setAuth(user, token) {
    if (token) localStorage.setItem('token', token);
    if (user) localStorage.setItem('user', JSON.stringify(user));
}
function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}
function currentUser() {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

// render navbar
function renderNav() {
    const navRoot = document.getElementById('nav-root');
    if (!navRoot) return;
    const user = currentUser();
    navRoot.innerHTML = '';
    const home = el('a', { href: './index.html' }, 'Home');
    navRoot.appendChild(home);
    const statsLink = el('a', { href: './stats.html' }, 'Stats');
    navRoot.appendChild(statsLink);

    if (user) {
        navRoot.appendChild(el('a', { href: './post_form.html' }, 'New Post'));
        navRoot.appendChild(el('a', { href: './profile.html' }, 'Profile'));
        const spacer = el('span', { class: 'spacer' }, '');
        navRoot.appendChild(spacer);
        const welcome = el('span', {}, `Signed in as ${user.username}`);
        navRoot.appendChild(welcome);
        const outBtn = el('button', { class: 'btn', onclick: 'doLogout()' }, 'Logout');
        navRoot.appendChild(outBtn);
    } else {
        navRoot.appendChild(el('a', { href: './login.html' }, 'Login'));
        navRoot.appendChild(el('a', { href: './register.html' }, 'Register'));
    }
}

function doLogout() {
    clearAuth();
    renderNav();
    window.location.href = './login.html';
}

// small helper to create element
function el(tag, attrs = {}, text = '') {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
        if (k === 'class') node.className = v;
        else if (k === 'onclick') node.setAttribute('onclick', v);
        else node.setAttribute(k, v);
    });
    if (text) node.textContent = text;
    return node;
}

// format date
function fmtDate(s) {
    try { return new Date(s).toLocaleString(); } catch { return s; }
}

// init nav on every page
document.addEventListener('DOMContentLoaded', () => {
    renderNav();
});
