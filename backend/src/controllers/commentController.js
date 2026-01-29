const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { Types } = require('mongoose');

// Create comment
exports.createComment = async (req, res) => {
    const session = await Comment.startSession();
    session.startTransaction();
    try {
        const { postId } = req.params;
        const { text, parentId = null } = req.body;
        if (!text) return res.status(400).json({ message: 'text required' });
        if (!Types.ObjectId.isValid(postId)) return res.status(400).json({ message: 'Invalid postId' });

        const post = await Post.findById(postId).session(session);
        if (!post) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Post not found' });
        }

        const comment = new Comment({
            postId,
            author: req.user._id,
            text,
            parentId: parentId && Types.ObjectId.isValid(parentId) ? parentId : null
        });

        await comment.save({ session });
        post.commentsCount = (post.commentsCount || 0) + 1;
        await post.save({ session });

        await session.commitTransaction();
        session.endSession();

        // populate author for response
        await comment.populate({ path: 'author', select: 'username' });

        return res.status(201).json({ comment });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('createComment', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// List comments for a post
exports.listCommentsForPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        if (!Types.ObjectId.isValid(postId)) return res.status(400).json({ message: 'Invalid postId' });

        const skip = (Math.max(1, parseInt(page)) - 1) * Math.max(1, parseInt(limit));
        const comments = await Comment.find({ postId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate({ path: 'author', select: 'username' })
            .lean();

        const total = await Comment.countDocuments({ postId });

        return res.json({ data: comments, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
    } catch (err) {
        console.error('listCommentsForPost', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Update comment (owner only)
exports.updateComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
        if (!text) return res.status(400).json({ message: 'text required' });

        const comment = await Comment.findById(id);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        if (comment.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });

        comment.text = text;
        comment.updatedAt = new Date();
        await comment.save();

        return res.json({ comment });
    } catch (err) {
        console.error('updateComment', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Delete comment (owner or post owner) - decrement commentsCount
exports.deleteComment = async (req, res) => {
    const session = await Comment.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Invalid id' });
        }

        const comment = await Comment.findById(id).session(session);
        if (!comment) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Comment not found' });
        }

        const post = await Post.findById(comment.postId).session(session);
        if (!post) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Post not found' });
        }

        // allow delete if author of comment OR author of post OR admin
        const isOwnerComment = comment.author.toString() === req.user._id.toString();
        const isOwnerPost = post.author.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwnerComment && !isOwnerPost && !isAdmin) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: 'Forbidden' });
        }

        await comment.deleteOne({ session });
        post.commentsCount = Math.max(0, (post.commentsCount || 1) - 1);
        await post.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.json({ message: 'Comment deleted' });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('deleteComment', err);
        return res.status(500).json({ message: 'Server error' });
    }
};
