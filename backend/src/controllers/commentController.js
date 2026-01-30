const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { Types } = require('mongoose');

// Create comment (referenced) + push preview into post.commentsPreview (max 5)
exports.createComment = async (req, res) => {
    let session = null;
    try {
        const { postId } = req.params;
        const { text, parentId = null } = req.body;
        if (!text) return res.status(400).json({ message: 'text required' });
        if (!Types.ObjectId.isValid(postId)) return res.status(400).json({ message: 'Invalid postId' });

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const commentDoc = {
            postId: Types.ObjectId(postId),
            author: req.user._id,
            text,
            parentId: parentId && Types.ObjectId.isValid(parentId) ? Types.ObjectId(parentId) : null
        };

        // Try transaction
        try {
            session = await Comment.startSession();
            session.startTransaction();

            const comment = await Comment.create([commentDoc], { session });
            const c = comment[0];

            const preview = {
                _id: c._id,
                authorId: req.user._id,
                authorName: req.user.username || '',
                text: text.substring(0, 200),
                createdAt: c.createdAt || new Date()
            };

            await Post.updateOne(
                { _id: postId },
                {
                    $inc: { commentsCount: 1 },
                    $push: { commentsPreview: { $each: [preview], $position: 0, $slice: 5 } }
                },
                { session }
            );

            await session.commitTransaction();
            session.endSession();

            await c.populate({ path: 'author', select: 'username' });
            return res.status(201).json({ comment: c });
        } catch (txErr) {
            // fallback non-transactional
            if (session) {
                try { await session.abortTransaction(); } catch (e) { }
                try { session.endSession(); } catch (e) { }
                session = null;
            }
            // create comment without session
            const c = await Comment.create(commentDoc);
            const preview = {
                _id: c._id,
                authorId: req.user._id,
                authorName: req.user.username || '',
                text: text.substring(0, 200),
                createdAt: c.createdAt || new Date()
            };
            await Post.updateOne(
                { _id: postId },
                {
                    $inc: { commentsCount: 1 },
                    $push: { commentsPreview: { $each: [preview], $position: 0, $slice: 5 } }
                }
            );
            await c.populate({ path: 'author', select: 'username' });
            return res.status(201).json({ comment: c });
        }
    } catch (err) {
        if (session && session.inTransaction()) {
            try { await session.abortTransaction(); } catch (e) { }
            try { session.endSession(); } catch (e) { }
        }
        console.error('createComment error', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Update comment text.
exports.updateComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

        const comment = await Comment.findById(id);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        const isAuthor = comment.author.toString() === req.user._id.toString();
        const isAdmin = req.user && req.user.role === 'admin';
        if (!isAuthor && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

        comment.text = text;
        comment.updatedAt = new Date();
        await comment.save();

        // update embedded preview text if exists
        await Post.updateOne(
            { _id: comment.postId },
            { $set: { 'commentsPreview.$[c].text': text.substring(0, 200) } },
            { arrayFilters: [{ 'c._id': Types.ObjectId(id) }] }
        );

        return res.json({ comment });
    } catch (err) {
        console.error('updateComment error', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Delete comment (author, post owner, or admin).
exports.deleteComment = async (req, res) => {
    let session = null;
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

        const comment = await Comment.findById(id);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        const post = await Post.findById(comment.postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const userId = req.user._id.toString();
        const isOwnerComment = comment.author.toString() === userId;
        const isOwnerPost = post.author.toString() === userId;
        const isAdmin = req.user && req.user.role === 'admin';
        if (!isOwnerComment && !isOwnerPost && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

        // transactional attempt
        try {
            session = await Comment.startSession();
            session.startTransaction();

            const delRes = await Comment.deleteOne({ _id: comment._id }).session(session);
            if (delRes.deletedCount === 0) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ message: 'Comment not found (concurrent)' });
            }

            await Post.updateOne(
                { _id: comment.postId },
                { $inc: { commentsCount: -1 }, $pull: { commentsPreview: { _id: Types.ObjectId(id) } } }
            ).session(session);

            await session.commitTransaction();
            session.endSession();

            // prevent negative count
            await Post.updateOne({ _id: comment.postId, commentsCount: { $lt: 0 } }, { $set: { commentsCount: 0 } });

            return res.json({ message: 'Comment deleted' });
        } catch (txErr) {
            if (session) {
                try { await session.abortTransaction(); } catch (e) { }
                try { session.endSession(); } catch (e) { }
                session = null;
            }
            // fallback non-transactional
            const del = await Comment.deleteOne({ _id: comment._id });
            if (del.deletedCount === 0) return res.status(404).json({ message: 'Comment not found (concurrent)' });

            await Post.updateOne(
                { _id: comment.postId },
                { $inc: { commentsCount: -1 }, $pull: { commentsPreview: { _id: Types.ObjectId(id) } } }
            );

            await Post.updateOne({ _id: comment.postId, commentsCount: { $lt: 0 } }, { $set: { commentsCount: 0 } });

            return res.json({ message: 'Comment deleted' });
        }
    } catch (err) {
        if (session && session.inTransaction()) {
            try { await session.abortTransaction(); } catch (e) { }
            try { session.endSession(); } catch (e) { }
        }
        console.error('deleteComment error', err);
        return res.status(500).json({ message: 'Server error' });
    }
};


// List comments for a post
exports.listCommentsForPost = async (req, res) => {
    try {
        const { postId } = req.params;
        if (!Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ message: 'Invalid postId' });
        }

        const comments = await Comment.find({ postId })
            .populate('author', 'username')
            .sort({ createdAt: -1 });

        return res.json({ comments });
    } catch (err) {
        console.error('listCommentsForPost error', err);
        return res.status(500).json({ message: 'Server error' });
    }
};