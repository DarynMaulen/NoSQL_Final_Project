// js/stats.js
const StatsPage = (() => {
    let monthlyChart = null;

    function init() {
        // init year default to current
        const y = new Date().getFullYear();
        document.getElementById('stats-year').value = y;

        // wire buttons
        document.getElementById('refresh-top').addEventListener('click', fetchTopPosts);
        document.getElementById('refresh-tags').addEventListener('click', fetchPopularTags);
        document.getElementById('refresh-authors').addEventListener('click', fetchPostsByAuthor);
        document.getElementById('refresh-monthly').addEventListener('click', fetchMonthlyPosts);
        // initial load
        fetchTopPosts();
        fetchPopularTags();
        fetchPostsByAuthor();
        fetchMetrics();
        fetchMonthlyPosts();
    }

    async function fetchTopPosts() {
        const limit = document.getElementById('top-limit').value || 10;
        const root = document.getElementById('top-posts-root');
        root.innerHTML = 'Loading...';
        try {
            const res = await apiFetch(`/api/stats/top-posts?limit=${limit}`);
            const data = res.data || [];
            root.innerHTML = '';
            data.forEach(p => {
                const elCard = el('div', { class: 'card' });
                const title = el('div', {}, p.title);
                title.style.fontWeight = '600';
                elCard.appendChild(title);
                elCard.appendChild(el('div', { class: 'small' }, `By ${p.author?.username || 'Unknown'} • likes: ${p.likes || 0} • comments: ${p.commentsCount || 0}`));
                if (p.excerpt) elCard.appendChild(el('div', {}, p.excerpt));
                root.appendChild(elCard);
            });
            if (data.length === 0) root.textContent = 'No posts';
        } catch (err) {
            root.textContent = 'Error: ' + err.message;
        }
    }

    async function fetchPopularTags() {
        const limit = document.getElementById('tags-limit').value || 10;
        const root = document.getElementById('popular-tags-root');
        root.innerHTML = 'Loading...';
        try {
            const res = await apiFetch(`/api/stats/popular-tags?limit=${limit}`);
            const data = res.data || [];
            root.innerHTML = '';
            const wrap = el('div', { class: 'tags' });
            data.forEach(t => {
                const tagEl = el('div', { class: 'card' });
                tagEl.style.display = 'inline-block';
                tagEl.style.margin = '6px';
                tagEl.style.padding = '8px';
                tagEl.appendChild(el('div', { style: 'font-weight:600' }, t.tag));
                tagEl.appendChild(el('div', { class: 'small' }, `count: ${t.count}`));
                wrap.appendChild(tagEl);
            });
            root.appendChild(wrap);
        } catch (err) {
            root.textContent = 'Error: ' + err.message;
        }
    }

    async function fetchPostsByAuthor() {
        const limit = document.getElementById('authors-limit').value || 10;
        const root = document.getElementById('posts-by-author-root');
        root.innerHTML = 'Loading...';
        try {
            const res = await apiFetch(`/api/stats/posts-by-author?limit=${limit}`);
            const data = res.data || [];
            root.innerHTML = '';
            const table = document.createElement('table');
            table.style.width = '100%';
            table.innerHTML = `<thead><tr><th>Author</th><th>Posts</th></tr></thead>`;
            const tbody = document.createElement('tbody');
            data.forEach(r => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${r.author?.username || 'Unknown'}</td><td>${r.count}</td>`;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            root.appendChild(table);
        } catch (err) {
            root.textContent = 'Error: ' + err.message;
        }
    }

    async function fetchMetrics() {
        const root = document.getElementById('metrics-root');
        root.innerHTML = 'Loading...';
        try {
            const res = await apiFetch(`/api/stats/avg-comments-per-post`);
            const d = res.data || { totalPosts: 0, totalComments: 0, avgComments: 0 };
            root.innerHTML = `
        <div>Total posts: <strong>${d.totalPosts}</strong></div>
        <div>Total comments: <strong>${d.totalComments}</strong></div>
        <div>Average comments / post: <strong>${d.avgComments}</strong></div>
      `;
        } catch (err) {
            root.textContent = 'Error: ' + err.message;
        }
    }

    async function fetchMonthlyPosts() {
        const canvas = document.getElementById('monthlyChart');
        const year = document.getElementById('stats-year').value || new Date().getFullYear();
        const root = document.getElementById('monthly-section');
        // loading indicator near chart
        try {
            const res = await apiFetch(`/api/stats/monthly-posts?year=${year}`);
            const data = res.data || [];
            const labels = data.map(d => `M${d.month}`);
            const values = data.map(d => d.count);
            // init chart
            if (!monthlyChart) {
                monthlyChart = new Chart(canvas.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [{
                            label: `Posts in ${year}`,
                            data: values,
                            backgroundColor: 'rgba(54, 162, 235, 0.6)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                });
            } else {
                monthlyChart.data.labels = labels;
                monthlyChart.data.datasets[0].data = values;
                monthlyChart.data.datasets[0].label = `Posts in ${year}`;
                monthlyChart.update();
            }
        } catch (err) {
            // display error under canvas
            const elErr = document.getElementById('monthly-error');
            if (!elErr) {
                const errDiv = el('div', { id: 'monthly-error', class: 'error' }, 'Error: ' + err.message);
                root.appendChild(errDiv);
            } else {
                elErr.textContent = 'Error: ' + err.message;
            }
        }
    }

    return { init };
})();
