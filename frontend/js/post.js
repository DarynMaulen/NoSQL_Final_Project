const PostPage = (() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    async function init() {
        if (!id) {
            document.getElementById('post-root').textContent = 'No post id provided';
            return;
        }
        await load();
        renderCommentForm();
    }

    async function load() {
        const root = document.getElementById('post-root');
        root.innerHTML = 'Loading...';
        try {
            const data = await apiFetch(`/api/posts/${id}`);
            const p = data.post;
            root.innerHTML = '';
            const title = el('h1', {}, p.title);
            root.appendChild(title);
            root.appendChild(el('div', { class: 'meta' }, `by ${p.author?.username || 'Unknown'} • ${fmtDate(p.createdAt)}`));
            if (p.tags?.length) {
                const tags = el('div', { class: 'tags' });
                p.tags.forEach(t => tags.appendChild(el('span', { class: 'tag' }, t)));
                root.appendChild(tags);
            }
            root.appendChild(el('div', { style: 'margin-top:12px; white-space:pre-wrap;' }, p.content));
            const controls = el('div', { class: 'controls' });
            const likeBtn = el('button', { class: 'btn', onclick: 'PostPage.toggleLike()' }, `Like (${p.likes || 0})`);
            controls.appendChild(likeBtn);

            const user = currentUser();
            if (user && p.author && user._id === p.author._id) {
                const editBtn = el('a', { href: `post_form.html?id=${p._id}` }, '');
                editBtn.appendChild(el('button', { class: 'btn' }, 'Edit'));
                controls.appendChild(editBtn);
                const delBtn = el('button', { class: 'btn', onclick: 'PostPage.deletePost()' }, 'Delete');
                controls.appendChild(delBtn);
            }
            root.appendChild(controls);

            // comments
            renderComments(p.comments || []);
        } catch (err) {
            document.getElementById('post-root').textContent = 'Failed to load post: ' + err.message;
        }
    }

    function renderComments(comments) {
        const root = document.getElementById('comments-root');
        root.innerHTML = '';
        root.appendChild(el('h3', {}, `Comments (${comments.length})`));
        if (comments.length === 0) root.appendChild(el('div', {}, 'No comments yet'));
        comments.forEach(c => {
            const div = el('div', { class: 'card comment' });
            div.appendChild(el('div', { class: 'small' }, `${c.author?.username || 'Unknown'} • ${fmtDate(c.createdAt)}`));
            div.appendChild(el('div', {}, c.text));
            root.appendChild(div);
        });
    }

    function renderCommentForm() {
        const root = document.getElementById('comment-form-root');
        const user = currentUser();
        root.innerHTML = '';
        if (!user) {
            root.appendChild(el('div', {}, 'Please '));
            root.appendChild(el('a', { href: './login.html' }, 'login'));
            return;
        }
        const ta = el('textarea', { id: 'comment-text', placeholder: 'Write a comment...' });
        const btn = el('button', { class: 'btn btn-primary', onclick: 'PostPage.submitComment()' }, 'Post comment');
        root.appendChild(ta);
        root.appendChild(btn);
        root.appendChild(el('div', { id: 'comment-error', class: 'error' }, ''));
    }

    async function submitComment() {
        try {
            const text = document.getElementById('comment-text').value.trim();
            if (!text) {
                document.getElementById('comment-error').textContent = 'Comment cannot be empty';
                return;
            }
            await apiFetch(`/api/comments/${id}`, { method: 'POST', body: { text } });
            document.getElementById('comment-text').value = '';
            await load();
        } catch (err) {
            document.getElementById('comment-error').textContent = err.message;
        }
    }

    async function toggleLike() {
        try {
            await apiFetch(`/api/posts/${id}/like`, { method: 'POST' });
            await load();
        } catch (err) {
            alert('Like failed: ' + err.message);
        }
    }

    async function deletePost() {
        if (!confirm('Delete this post?')) return;
        try {
            await apiFetch(`/api/posts/${id}`, { method: 'DELETE' });
            window.location.href = './index.html';
        } catch (err) {
            alert('Delete failed: ' + err.message);
        }
    }

    return {
        init,
        submitComment,
        toggleLike,
        deletePost,
        load
    };
})();
