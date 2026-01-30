const PostForm = (() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id'); // if present -> edit mode
    const editMode = !!id;

    async function init() {
        const root = document.getElementById('form-root');
        root.innerHTML = '';
        const h = el('h2', {}, editMode ? 'Edit Post' : 'Create Post');
        root.appendChild(h);

        root.appendChild(el('div', { id: 'form-error', class: 'error' }, ''));

        const title = el('input', { id: 'post-title', class: 'input', placeholder: 'Title' });
        const category = el('input', { id: 'post-category', class: 'input', placeholder: 'Category' });
        const tags = el('input', { id: 'post-tags', class: 'input', placeholder: 'Tags (comma separated)' });
        const status = el('select', { id: 'post-status', class: 'input' });
        status.innerHTML = `<option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>`;
        const content = el('textarea', { id: 'post-content', class: 'input', placeholder: 'Content' });

        root.appendChild(el('div', {}, 'Title')); root.appendChild(title);
        root.appendChild(el('div', {}, 'Category')); root.appendChild(category);
        root.appendChild(el('div', {}, 'Tags')); root.appendChild(tags);
        root.appendChild(el('div', {}, 'Status')); root.appendChild(status);
        root.appendChild(el('div', {}, 'Content')); root.appendChild(content);

        const submitBtn = el('button', { class: 'btn btn-primary', onclick: 'PostForm.submit()' }, editMode ? 'Save' : 'Create');
        const cancelBtn = el('button', { class: 'btn', onclick: 'PostForm.cancel()' }, 'Cancel');
        root.appendChild(el('div', { class: 'controls' }, ''));
        root.querySelector('.controls').appendChild(submitBtn);
        root.querySelector('.controls').appendChild(cancelBtn);

        if (editMode) await loadPost();
    }

    async function loadPost() {
        try {
            const data = await apiFetch(`/api/posts/${id}`);
            const p = data.post;
            // only owner should edit
            const user = currentUser();
            if (!user || !p.author || user._id !== p.author._id) {
                document.getElementById('form-error').textContent = 'You are not authorized to edit this post';
                disableForm();
                return;
            }
            document.getElementById('post-title').value = p.title || '';
            document.getElementById('post-category').value = p.category || '';
            document.getElementById('post-tags').value = (p.tags || []).join(',');
            document.getElementById('post-status').value = p.status || 'draft';
            document.getElementById('post-content').value = p.content || '';
        } catch (err) {
            document.getElementById('form-error').textContent = 'Failed to load post: ' + err.message;
        }
    }

    function disableForm() {
        ['post-title', 'post-category', 'post-tags', 'post-content', 'post-status'].forEach(id => {
            const el0 = document.getElementById(id);
            if (el0) el0.disabled = true;
        });
    }

    async function submit() {
        const errEl = document.getElementById('form-error');
        errEl.textContent = '';
        const title = document.getElementById('post-title').value.trim();
        const category = document.getElementById('post-category').value.trim();
        const tags = document.getElementById('post-tags').value.split(',').map(x => x.trim()).filter(Boolean);
        const status = document.getElementById('post-status').value;
        const content = document.getElementById('post-content').value.trim();
        if (!title || !content) { errEl.textContent = 'Title and content are required'; return; }
        const body = { title, content, tags, category, status };
        try {
            if (editMode) {
                await apiFetch(`/api/posts/${id}`, { method: 'PUT', body });
            } else {
                await apiFetch(`/api/posts`, { method: 'POST', body });
            }
            window.location.href = './index.html';
        } catch (err) {
            errEl.textContent = err.message;
        }
    }

    function cancel() {
        window.history.back();
    }

    return { init, submit, cancel };
})();
