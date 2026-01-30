const Post = require('../models/Post');
const { Types } = require('mongoose');

/**
 * GET /api/stats/top-posts?limit=10
 * Returns top posts by likes (and comments as tie-breaker).
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
                    title: 1,
                    excerpt: 1,
                    tags: 1,
                    category: 1,
                    likes: 1,
                    commentsCount: 1,
                    createdAt: 1,
                    'author._id': 1,
                    'author.username': 1
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
 * GET /api/stats/monthly-posts?year=2025
 * Returns number of published posts per month for a given year.
 */
exports.monthlyPosts = async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const start = new Date(Date.UTC(year, 0, 1));
        const end = new Date(Date.UTC(year + 1, 0, 1));

        const pipeline = [
            {
                $match: {
                    status: 'published',
                    createdAt: { $gte: start, $lt: end }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } },
            {
                $project: {
                    month: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ];

        const results = await Post.aggregate(pipeline);
        // ensure months with zero are present
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
