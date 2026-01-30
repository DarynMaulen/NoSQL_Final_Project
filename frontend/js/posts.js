const PostsPage = (() => {
    let page = 1, limit = 8;

    async function fetchPosts() {
        const root = document.getElementById('posts-root');
        root.innerHTML = 'Loading...';
        try {
            const data = await apiFetch(`/api/posts?page=${page}&limit=${limit}&status=published`);
            const posts = data.data || [];
            root.innerHTML = '';
            if (posts.length === 0) {
                root.appendChild(el('div', {}, 'No posts yet.'));
            }
            posts.forEach(p => {
                const card = el('div', { class: 'card' });
                const title = el('h3', {}, '');
                const link = el('a', { href: `post.html?id=${p._id}` }, p.title);
                title.appendChild(link);
                card.appendChild(title);
                card.appendChild(el('div', { class: 'meta' }, `by ${p.author?.username || 'Unknown'} • ${fmtDate(p.createdAt)}`));
                if (p.excerpt) card.appendChild(el('p', {}, p.excerpt));
                if (p.tags?.length) {
                    const tags = el('div', { class: 'tags' });
                    p.tags.forEach(t => tags.appendChild(el('span', { class: 'tag' }, t)));
                    card.appendChild(tags);
                }
                root.appendChild(card);
            });

            renderPager();
        } catch (err) {
            document.getElementById('posts-root').textContent = 'Failed to load posts: ' + err.message;
        }
    }

    function renderPager() {
        const pager = document.getElementById('pager');
        pager.innerHTML = '';
        const prev = el('button', { class: 'btn', onclick: 'PostsPage.prev()' }, 'Prev');
        const next = el('button', { class: 'btn', onclick: 'PostsPage.next()' }, 'Next');
        pager.appendChild(prev);
        pager.appendChild(el('span', {}, ` Page ${page} `));
        pager.appendChild(next);
    }

    return {
        init: fetchPosts,
        next: () => { page++; fetchPosts(); },
        prev: () => { if (page > 1) page--; fetchPosts(); }
    };
})();
