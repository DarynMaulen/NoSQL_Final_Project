const blogPosts = [
    {
        title: 'My 2026 Tech Stack for Web Development',
        category: 'tech',
        tags: ['javascript', 'nodejs', 'mongodb'],
        content: 'This year I am moving all my projects to a modular architecture...',
        status: 'published'
    },
    {
        title: '7 Days in Tokyo: An Unforgettable Journey',
        category: 'travel',
        tags: ['japan', 'travel', 'guide'],
        content: 'Tokyo is a city where the future meets the past. I spent my first day in Shibuya...',
        status: 'published'
    },
    {
        title: 'The Secret to the Perfect Homemade Pizza',
        category: 'food',
        tags: ['recipe', 'italian', 'cooking'],
        content: 'It all starts with the dough. You need 72 hours of cold fermentation...',
        status: 'published'
    },
    {
        title: 'Minimalism: How to Declutter Your Digital Life',
        category: 'lifestyle',
        tags: ['productivity', 'minimalism', 'tips'],
        content: 'We often talk about physical clutter, but digital noise is just as stressful...',
        status: 'published'
    },
    {
        title: 'Why I Switched from VS Code to Vim',
        category: 'tech',
        tags: ['tools', 'coding', 'productivity'],
        content: 'It was a painful month, but my typing speed and focus have doubled...',
        status: 'published'
    },
    {
        title: 'Best Coffee Shops in Istanbul: A Local Guide',
        category: 'travel',
        tags: ['turkey', 'coffee', 'travel'],
        content: 'If you are looking for authentic Turkish coffee or a modern flat white...',
        status: 'published'
    }
];

for (let i = 0; i < blogPosts.length; i++) {
    const data = blogPosts[i];
    const p = await Post.create({
        author: i % 2 === 0 ? bob._id : alice._id,
        title: data.title,
        slug: data.title.toLowerCase().replace(/ /g, '-') + '-' + i,
        content: data.content,
        tags: data.tags,
        category: data.category,
        status: data.status,
        likes: Math.floor(Math.random() * 100),
        commentsCount: 0,
        createdAt: new Date(2025, i, 15) // distributed by months in 2025
    });

    // Generates random comments for each post
    const commentsNum = Math.floor(Math.random() * 4) + 1;
    for (let j = 0; j < commentsNum; j++) {
        await Comment.create({
            postId: p._id,
            author: Math.random() > 0.5 ? alice._id : bob._id,
            text: ['Great article!', 'I need to try this!', 'Useful tips, thanks!', 'Interesting point of view.'][j]
        });
        p.commentsCount++;
    }
    await p.save();
}