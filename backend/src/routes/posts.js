const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const postController = require('../controllers/postController');
const auth = require('../middlewares/auth');
const ownerOnly = require('../middlewares/ownerOnly');
const Post = require('../models/Post');

// create post (auth)
router.post(
    '/',
    auth,
    [
        body('title').isLength({ min: 3 }).withMessage('title min 3 chars'),
        body('content').isLength({ min: 10 }).withMessage('content min 10 chars')
    ],
    postController.createPost
);

// list posts
router.get('/', postController.listPosts);

// get single post
router.get('/:id', postController.getPost);

// update post (owner only)
router.put(
    '/:id',
    auth,
    ownerOnly(async (req) => {
        // return author id for resource
        const p = await Post.findById(req.params.id).select('author');
        return p ? p.author : null;
    }),
    postController.updatePost
);

// delete post (owner only)
router.delete(
    '/:id',
    auth,
    ownerOnly(async (req) => {
        const p = await Post.findById(req.params.id).select('author');
        return p ? p.author : null;
    }),
    postController.deletePost
);

// tags
router.post('/:id/tags', auth, postController.addTag);
router.delete('/:id/tags', auth, postController.removeTag);

// like toggle
router.post('/:id/like', auth, postController.toggleLike);

module.exports = router;
