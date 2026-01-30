const PostsPage = (() => {
    let currentPage = 1;
    let limit = 8;
    let totalPages = 1;

    async function fetchPosts() {
        const root = document.getElementById('posts-root');
        root.innerHTML = 'Loading...';
        try {
            const response = await apiFetch(`/api/posts?page=${currentPage}&limit=${limit}&status=published`);
            const posts = response.data || response;
            const pagination = response.pagination || { page: 1, pages: 1 };

            currentPage = pagination.page;
            totalPages = pagination.pages;

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

                if (p.commentsPreview && p.commentsPreview.length > 0) {
                    const previewContainer = el('div', { class: 'post-preview-box' });

                    previewContainer.appendChild(el('div', { class: 'preview-title' }, 'Recent comments:'));

                    p.commentsPreview.slice(0, 3).forEach(comment => {
                        const item = el('div', { class: 'preview-item' }, `${comment.authorName}: ${comment.text.substring(0, 60)}...`);
                        previewContainer.appendChild(item);
                    });

                    card.appendChild(previewContainer);
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
        if (currentPage <= 1) {
            prev.disabled = true;
            prev.style.opacity = '0.5';
            prev.style.cursor = 'not-allowed';
        }

        const next = el('button', { class: 'btn', onclick: 'PostsPage.next()' }, 'Next');
        if (currentPage >= totalPages) {
            next.disabled = true;
            next.style.opacity = '0.5';
            next.style.cursor = 'not-allowed';
        }

        pager.appendChild(prev);
        pager.appendChild(el('span', { style: 'margin: 0 10px' }, ` Page ${currentPage} of ${totalPages} `));
        pager.appendChild(next);
    }

    return {
        init: fetchPosts,
        next: () => {
            if (currentPage < totalPages) {
                currentPage++;
                fetchPosts();
            }
        },
        prev: () => {
            if (currentPage > 1) {
                currentPage--;
                fetchPosts();
            }
        }
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('posts-root')) {
        PostsPage.init();
    }
});