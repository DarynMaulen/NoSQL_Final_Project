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
            profileCard.appendChild(el('div', { class: 'profile-info' }, `Username: ${user.username}`));
            profileCard.appendChild(el('div', { class: 'profile-info' }, `Email: ${user.email}`));
            if (user.bio) profileCard.appendChild(el('div', { class: 'profile-bio' }, user.bio));

            root.innerHTML = '';
            root.appendChild(profileCard);

            const postsData = await apiFetch(`/api/posts?author=${user._id}&status=&page=1&limit=50`);
            const posts = postsData.data || [];
            const postsCard = el('div', { class: 'card' });
            postsCard.appendChild(el('h3', {}, 'My posts'));

            if (posts.length === 0) postsCard.appendChild(el('div', { class: 'no-posts' }, 'No posts yet.'));

            posts.forEach(p => {
                const row = el('div', { class: 'profile-post-row' });

                const left = el('div', { class: 'post-info-left' });
                left.appendChild(el('a', { href: `post.html?id=${p._id}`, class: 'post-link' }, p.title));
                left.appendChild(el('div', { class: 'small' }, `${p.status.toUpperCase()} • ${fmtDate(p.createdAt)}`));
                row.appendChild(left);

                const controls = el('div', { class: 'post-controls-right' });

                controls.appendChild(el('a', {
                    href: `post_form.html?id=${p._id}`,
                    class: 'btn btn-edit-profile'
                }, 'Edit'));

                controls.appendChild(el('button', {
                    class: 'btn btn-danger btn-sm',
                    onclick: `ProfilePage.deletePost('${p._id}')`
                }, 'Delete'));

                row.appendChild(controls);
                postsCard.appendChild(row);
            });

            root.appendChild(postsCard);
        } catch (err) {
            root.innerHTML = `<div class="card error">Failed to load profile: ${err.message}</div>`;
        }
    }

    async function deletePost(id) {
        if (!confirm('Delete post?')) return;
        try {
            await apiFetch(`/api/posts/${id}`, { method: 'DELETE' });
            await init();
        } catch (err) {
            alert('Delete failed: ' + err.message);
        }
    }

    return { init, deletePost };
})();