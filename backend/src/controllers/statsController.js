const Post = require('../models/Post');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');

/**
 * GET /api/stats/top-posts?limit=10
 * Top published posts by likes.
 */
exports.topPosts = async (req, res) => {
    try {
        const limit = Math.min(100, parseInt(req.query.limit) || 10);
        const pipeline = [
            { $match: { status: 'published' } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author'
                }
            },
            { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    title: 1, excerpt: 1, tags: 1, category: 1,
                    likes: 1, commentsCount: 1, createdAt: 1,
                    'author._id': 1, 'author.username': 1
                }
            },
            { $sort: { likes: -1, commentsCount: -1, createdAt: -1 } },
            { $limit: limit }
        ];
        const results = await Post.aggregate(pipeline);
        res.json({ data: results });
    } catch (err) {
        console.error('topPosts', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /api/stats/popular-tags?limit=20
 * Returns tags sorted by count (how many published posts contain the tag).
 */
exports.popularTags = async (req, res) => {
    try {
        const limit = Math.min(200, parseInt(req.query.limit) || 20);
        const pipeline = [
            { $match: { status: 'published', tags: { $exists: true, $ne: [] } } },
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit },
            { $project: { tag: '$_id', count: 1, _id: 0 } }
        ];
        const results = await Post.aggregate(pipeline);
        res.json({ data: results });
    } catch (err) {
        console.error('popularTags', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /api/stats/posts-by-author?limit=50
 * Returns authors with counts of published posts (useful for leaderboards).
 */
exports.postsByAuthor = async (req, res) => {
    try {
        const limit = Math.min(500, parseInt(req.query.limit) || 50);
        const pipeline = [
            { $match: { status: 'published' } },
            { $group: { _id: '$author', count: { $sum: 1 } } },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'author'
                }
            },
            { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
            { $sort: { count: -1 } },
            { $limit: limit },
            { $project: { author: { _id: '$author._id', username: '$author.username' }, count: 1, _id: 0 } }
        ];
        const results = await Post.aggregate(pipeline);
        res.json({ data: results });
    } catch (err) {
        console.error('postsByAuthor', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /api/stats/avg-comments-per-post
 * Returns aggregate stats: average comments per published post, median-ish, total posts, total comments.
 */
exports.avgCommentsPerPost = async (req, res) => {
    try {
        const pipeline = [
            { $match: { status: 'published' } },
            {
                $group: {
                    _id: null,
                    totalPosts: { $sum: 1 },
                    totalComments: { $sum: '$commentsCount' },
                    avgComments: { $avg: '$commentsCount' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalPosts: 1,
                    totalComments: 1,
                    avgComments: { $round: ['$avgComments', 2] }
                }
            }
        ];
        const [res0] = await Post.aggregate(pipeline);
        res.json({ data: res0 || { totalPosts: 0, totalComments: 0, avgComments: 0 } });
    } catch (err) {
        console.error('avgCommentsPerPost', err);
        res.status(500).json({ message: 'Server error' });
    }
};


/**
 * GET /api/stats/monthly-posts?year=2025
 */
exports.monthlyPosts = async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const start = new Date(Date.UTC(year, 0, 1));
        const end = new Date(Date.UTC(year + 1, 0, 1));

        const pipeline = [
            { $match: { status: 'published', createdAt: { $gte: start, $lt: end } } },
            { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
            { $sort: { '_id': 1 } },
            { $project: { month: '$_id', count: 1, _id: 0 } }
        ];

        const results = await Post.aggregate(pipeline);
        const months = Array.from({ length: 12 }, (_, i) => {
            const found = results.find(r => r.month === i + 1);
            return { month: i + 1, count: found ? found.count : 0 };
        });

        res.json({ year, data: months });
    } catch (err) {
        console.error('monthlyPosts', err);
        res.status(500).json({ message: 'Server error' });
    }
};
