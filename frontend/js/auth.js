const Auth = (() => {
    function init() {
        // if logged in, redirect to home
        if (currentUser()) {
            // do not auto-redirect on register page
        }
    }

    async function login() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const err = document.getElementById('login-error');
        err.textContent = '';
        if (!email || !password) { err.textContent = 'Email and password required'; return; }
        try {
            const res = await apiFetch('/api/auth/login', { method: 'POST', body: { email, password } });
            setAuth(res.user, res.token);
            renderNav();
            window.location.href = './index.html';
        } catch (e) {
            err.textContent = e.message;
        }
    }

    async function register() {
        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const err = document.getElementById('register-error');
        err.textContent = '';
        if (!username || !email || !password) { err.textContent = 'All fields required'; return; }
        try {
            const res = await apiFetch('/api/auth/register', { method: 'POST', body: { username, email, password } });
            setAuth(res.user, res.token);
            renderNav();
            window.location.href = './index.html';
        } catch (e) {
            err.textContent = e.message;
        }
    }

    return { init, login, register };
})();
