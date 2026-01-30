const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');

async function ensureIndexes() {
    // existing
    await Post.collection.createIndex({ slug: 1 }, { unique: true, background: true });

    // compound indexes:
    // 1) author + status + createdAt (fast posts by author, by status, sorted by date)
    await Post.collection.createIndex({ author: 1, status: 1, createdAt: -1 }, { background: true });

    // 2) tags + status + createdAt (filter by tag & status, sort by date)
    await Post.collection.createIndex({ tags: 1, status: 1, createdAt: -1 }, { background: true });

    // 3) likes + createdAt (for top posts by likes then by recency)
    await Post.collection.createIndex({ likes: -1, createdAt: -1 }, { background: true });

    // 4) status + createdAt already helps monthly aggregation and listing
    await Post.collection.createIndex({ status: 1, createdAt: -1 }, { background: true });

    // text index
    await Post.collection.createIndex({ title: 'text', content: 'text', tags: 'text' }, { background: true, name: 'posts_text_idx' });

    // Comments
    await Comment.collection.createIndex({ postId: 1, createdAt: -1 }, { background: true });
    // Optionally: author + createdAt (for user activity queries)
    await Comment.collection.createIndex({ author: 1, createdAt: -1 }, { background: true });

    // Users
    await User.collection.createIndex({ email: 1 }, { unique: true, background: true });
    await User.collection.createIndex({ username: 1 }, { unique: true, background: true });

    console.log('Indexes ensured (compound + others)');
}

module.exports = ensureIndexes;
