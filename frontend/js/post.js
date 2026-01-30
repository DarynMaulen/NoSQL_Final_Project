const PostPage = (() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    let currentParentId = null;

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

            root.appendChild(el('h1', {}, p.title));
            root.appendChild(el('div', { class: 'meta' }, `by ${p.author?.username || 'Unknown'} • ${fmtDate(p.createdAt)}`));

            if (p.tags?.length) {
                const tagsDiv = el('div', { class: 'tags-container' });
                p.tags.forEach(t => tagsDiv.appendChild(el('span', { class: 'tag' }, t)));
                root.appendChild(tagsDiv);
            }

            root.appendChild(el('div', { class: 'post-content' }, p.content));

            const controls = el('div', { class: 'post-controls' });
            controls.appendChild(el('button', { class: 'btn', onclick: 'PostPage.toggleLike()' }, `Like (${p.likes || 0})`));

            const user = currentUser();
            const isAdmin = user && user.role === 'admin';
            const isOwner = user && p.author && user._id === p.author._id;

            if (isOwner || isAdmin) {
                const editBtn = el('button', {
                    class: 'btn',
                    onclick: `location.href='post_form.html?id=${p._id}'`
                }, 'Edit');

                const delBtn = el('button', {
                    class: 'btn btn-danger',
                    onclick: 'PostPage.deletePost()'
                }, 'Delete Post');

                controls.appendChild(editBtn);
                controls.appendChild(delBtn);
            }

            root.appendChild(controls);

            renderComments(p.comments || []);
        } catch (err) {
            root.textContent = 'Error: ' + err.message;
        }
    }

    function renderComments(comments) {
        const container = document.getElementById('comments-root');
        container.innerHTML = '';
        container.appendChild(el('h3', {}, `Comments (${comments.length})`));

        if (comments.length === 0) {
            container.appendChild(el('div', { class: 'no-comments' }, 'No comments yet.'));
            return;
        }

        const rootComments = comments.filter(c => !c.parentId);
        rootComments.forEach(c => renderCommentNodeRecursive(c, comments, container));
    }

    function renderCommentNodeRecursive(comment, allComments, container) {
        const node = createCommentNode(comment);
        container.appendChild(node);

        const children = allComments.filter(child => child.parentId === comment._id);
        if (children.length > 0) {
            const repliesDiv = el('div', { class: 'replies-container' });
            children.forEach(child => renderCommentNodeRecursive(child, allComments, repliesDiv));
            container.appendChild(repliesDiv);
        }
    }

    function createCommentNode(c) {
        const div = el('div', { class: 'comment-card' });

        div.appendChild(el('div', { class: 'comment-meta' }, `${c.author?.username || 'Unknown'} • ${fmtDate(c.createdAt)}`));

        div.appendChild(el('div', { class: 'comment-text' }, c.text));

        const actions = el('div', { class: 'comment-actions' });
        if (currentUser()) {
            actions.appendChild(el('button', { class: 'btn-reply', onclick: `PostPage.replyTo('${c._id}', '${c.author?.username || 'User'}')` }, 'Reply'));
        }

        const user = currentUser();
        if (user && (user._id === (c.author?._id || c.author) || user.role === 'admin')) {
            actions.appendChild(el('button', { class: 'btn-delete-comment', onclick: `PostPage.deleteComment('${c._id}')` }, 'Delete'));
        }

        div.appendChild(actions);
        return div;
    }

    function renderCommentForm() {
        const root = document.getElementById('comment-form-root');
        const user = currentUser();
        root.innerHTML = '';

        if (!user) {
            root.innerHTML = '<p>Please <a href="login.html">login</a> to comment.</p>';
            return;
        }

        root.appendChild(el('div', { id: 'reply-status', style: 'display:none' }));
        root.appendChild(el('textarea', { id: 'comment-text', class: 'form-control', placeholder: 'Write a comment...' }));
        root.appendChild(el('button', { class: 'btn btn-primary', onclick: 'PostPage.submitComment()' }, 'Post comment'));
        root.appendChild(el('div', { id: 'comment-error', class: 'error' }));
    }

    function replyTo(commentId, username) {
        currentParentId = commentId;
        const status = document.getElementById('reply-status');
        status.style.display = 'block';
        status.innerHTML = `Replying to <b>${username}</b> <span class="cancel-reply" onclick="PostPage.cancelReply()">✕ Cancel</span>`;
        document.getElementById('comment-text').focus();
    }

    function cancelReply() {
        currentParentId = null;
        document.getElementById('reply-status').style.display = 'none';
        document.getElementById('comment-text').placeholder = 'Write a comment...';
    }

    async function submitComment() {
        const textInput = document.getElementById('comment-text');
        const text = textInput.value.trim();
        if (!text) return;

        try {
            const payload = { text };
            if (currentParentId) payload.parentId = currentParentId;
            await apiFetch(`/api/comments/${id}`, { method: 'POST', body: payload });
            textInput.value = '';
            cancelReply();
            await load();
        } catch (err) {
            document.getElementById('comment-error').textContent = err.message;
        }
    }

    async function deleteComment(commentId) {
        if (!confirm('Delete comment?')) return;
        try {
            await apiFetch(`/api/comments/comment/${commentId}`, { method: 'DELETE' });
            await load();
        } catch (err) { alert(err.message); }
    }

    async function toggleLike() {
        try {
            await apiFetch(`/api/posts/${id}/like`, { method: 'POST' });
            await load();
        } catch (err) { alert(err.message); }
    }

    async function deletePost() {
        if (!confirm('Delete post?')) return;
        try {
            await apiFetch(`/api/posts/${id}`, { method: 'DELETE' });
            location.href = 'index.html';
        } catch (err) { alert(err.message); }
    }

    return { init, submitComment, toggleLike, deletePost, load, replyTo, cancelReply, deleteComment };
})();

document.addEventListener('DOMContentLoaded', PostPage.init);