const Post = require('../models/Post');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');

// Create post
exports.createPost = async (req, res) => {
    try {
        const { title, content, tags = [], category, status = 'draft' } = req.body;
        if (!title || !content) return res.status(400).json({ message: 'Title and content required' });

        const post = new Post({
            author: req.user._id,
            title,
            content,
            tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean),
            category,
            status
        });

        await post.save();
        return res.status(201).json({ post });
    } catch (err) {
        console.error('createPost', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// List posts
exports.listPosts = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, author } = req.query;
        const filter = {};

        if (author) filter.author = author;

        const userId = req.user ? req.user._id.toString() : null;
        const isAdmin = req.user && req.user.role === 'admin';
        const isOwner = author && userId === author;

        if (isAdmin || isOwner) {
            if (status) filter.status = status;
        } else {
            filter.status = 'published';
        }

        const skip = (page - 1) * limit;
        const posts = await Post.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('author', 'username')
            .lean();

        const total = await Post.countDocuments(filter);

        res.json({
            data: posts,
            meta: { total, page: Number(page), limit: Number(limit) }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single post
exports.getPost = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

        const pipeline = [
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author'
                }
            },
            { $unwind: '$author' },
            {
                $lookup: {
                    from: 'comments',
                    let: { postId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$postId', '$$postId'] } } },
                        { $sort: { createdAt: -1 } },
                        { $limit: 50 },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'author',
                                foreignField: '_id',
                                as: 'author'
                            }
                        },
                        { $unwind: '$author' },
                        {
                            $project: {
                                text: 1,
                                createdAt: 1,
                                parentId: 1,
                                'author._id': 1,
                                'author.username': 1
                            }
                        }
                    ],
                    as: 'comments'
                }
            },
            {
                $project: {
                    title: 1, content: 1, excerpt: 1, tags: 1, category: 1,
                    likes: 1, commentsCount: 1, status: 1, createdAt: 1, updatedAt: 1,
                    'author._id': 1, 'author.username': 1, 'author.email': 1,
                    comments: 1, commentsPreview: 1, likedBy: 1
                }
            }
        ];

        const results = await Post.aggregate(pipeline);
        if (!results || results.length === 0) return res.status(404).json({ message: 'Post not found' });

        return res.json({ post: results[0] });
    } catch (err) {
        console.error('getPost', err);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update post
exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

        const { title, content, tags, category, status } = req.body;
        const update = {};
        if (title) update.title = title;
        if (content) update.content = content;
        if (typeof tags !== 'undefined') {
            update.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean);
        }
        if (category) update.category = category;
        if (status) update.status = status;
        update.updatedAt = new Date();

        const post = await Post.findByIdAndUpdate(id, { $set: update }, { new: true });
        if (!post) return res.status(404).json({ message: 'Post not found' });

        return res.json({ post });
    } catch (err) {
        console.error('updatePost', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Delete post
exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const soft = req.query.soft === 'true';
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

        if (soft) {
            const post = await Post.findByIdAndUpdate(id, { $set: { status: 'archived', updatedAt: new Date() } }, { new: true });
            if (!post) return res.status(404).json({ message: 'Post not found' });
            return res.json({ message: 'Post archived', post });
        } else {
            const post = await Post.findByIdAndDelete(id);
            if (!post) return res.status(404).json({ message: 'Post not found' });
            await Comment.deleteMany({ postId: post._id });
            return res.json({ message: 'Post and comments deleted' });
        }
    } catch (err) {
        console.error('deletePost', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Add tag
exports.addTag = async (req, res) => {
    try {
        const { id } = req.params;
        const { tag } = req.body;
        if (!tag) return res.status(400).json({ message: 'tag required' });
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

        const post = await Post.findByIdAndUpdate(id, { $addToSet: { tags: tag } }, { new: true });
        if (!post) return res.status(404).json({ message: 'Post not found' });
        return res.json({ post });
    } catch (err) {
        console.error('addTag', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Remove tag
exports.removeTag = async (req, res) => {
    try {
        const { id } = req.params;
        const { tag } = req.body;
        if (!tag) return res.status(400).json({ message: 'tag required' });
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

        const post = await Post.findByIdAndUpdate(id, { $pull: { tags: tag } }, { new: true });
        if (!post) return res.status(404).json({ message: 'Post not found' });
        return res.json({ post });
    } catch (err) {
        console.error('removeTag', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Toggle like
exports.toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const already = post.likedBy.some(x => x.toString() === userId.toString());
        if (already) {
            await Post.updateOne({ _id: id }, { $pull: { likedBy: userId }, $inc: { likes: -1 } });
            return res.json({ message: 'Unliked' });
        } else {
            await Post.updateOne({ _id: id }, { $addToSet: { likedBy: userId }, $inc: { likes: 1 } });
            return res.json({ message: 'Liked' });
        }
    } catch (err) {
        console.error('toggleLike', err);
        return res.status(500).json({ message: 'Server error' });
    }
};