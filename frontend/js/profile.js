const ProfilePage = (() => {
    async function init() {
        const root = document.getElementById('profile-root');
        const user = currentUser();
        if (!user) {
            root.innerHTML = `<div class="card"><div>Please <a href="login.html">login</a> to view your profile.</div></div>`;
            return;
        }

        root.innerHTML = '<div class="card">Loading...</div>';
        try {
            const profileCard = el('div', { class: 'card' });
            profileCard.appendChild(el('h2', {}, 'Profile'));
            profileCard.appendChild(el('div', {}, `Username: ${user.username}`));
            profileCard.appendChild(el('div', {}, `Email: ${user.email}`));
            if (user.bio) profileCard.appendChild(el('div', {}, user.bio));
            root.innerHTML = '';
            root.appendChild(profileCard);

            // my posts - include all statuses
            const postsData = await apiFetch(`/api/posts?author=${user._id}&status=&page=1&limit=50`);
            const posts = postsData.data || [];
            const postsCard = el('div', { class: 'card' });
            postsCard.appendChild(el('h3', {}, 'My posts'));
            if (posts.length === 0) postsCard.appendChild(el('div', {}, 'No posts yet.'));
            posts.forEach(p => {
                const row = el('div', { style: 'display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-top:1px solid #f1f1f1' });
                const left = el('div', {});
                left.appendChild(el('a', { href: `post.html?id=${p._id}` }, p.title));
                left.appendChild(el('div', { class: 'small' }, `${p.status} • ${fmtDate(p.createdAt)}`));
                row.appendChild(left);
                const controls = el('div', {});
                controls.appendChild(el('a', { href: `post_form.html?id=${p._id}` }, 'Edit'));
                controls.appendChild(el('button', { class: 'btn', onclick: `ProfilePage.deletePost('${p._id}')` }, 'Delete'));
                row.appendChild(controls);
                postsCard.appendChild(row);
            });
            root.appendChild(postsCard);
        } catch (err) {
            root.innerHTML = `<div class="card">Failed to load profile: ${err.message}</div>`;
        }
    }

    async function deletePost(id) {
        if (!confirm('Delete post?')) return;
        try {
            await apiFetch(`/api/posts/${id}`, { method: 'DELETE' });
            await init(); // refresh
        } catch (err) {
            alert('Delete failed: ' + err.message);
        }
    }

    return { init, deletePost };
})();
