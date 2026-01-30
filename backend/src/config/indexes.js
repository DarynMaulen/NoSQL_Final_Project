const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');

async function ensureIndexes() {
    // Posts:
    // 1) unique slug index
    await Post.collection.createIndex({ slug: 1 }, { unique: true, background: true });

    // 2) compound index for author + createdAt to speed up "posts by author" sorted by time
    await Post.collection.createIndex({ author: 1, createdAt: -1 }, { background: true });

    // 3) tags multikey index for filtering by tag
    await Post.collection.createIndex({ tags: 1 }, { background: true });

    // 4) text index for search on title + content + tags
    await Post.collection.createIndex({ title: 'text', content: 'text', tags: 'text' }, { background: true, name: 'posts_text_idx' });

    // 5) index for status + createdAt (filtering by status and sorting / range queries)
    await Post.collection.createIndex({ status: 1, createdAt: -1 }, { background: true });

    // Comments:
    await Comment.collection.createIndex({ postId: 1, createdAt: -1 }, { background: true });

    // Users:
    await User.collection.createIndex({ email: 1 }, { unique: true, background: true });
    await User.collection.createIndex({ username: 1 }, { unique: true, background: true });

    console.log('Indexes ensured');
}

module.exports = ensureIndexes;
