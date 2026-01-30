const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const postController = require('../controllers/postController');
const { auth, optionalAuth } = require('../middlewares/auth'); 
const ownerOnly = require('../middlewares/ownerOnly');
const Post = require('../models/Post');

router.get('/', optionalAuth, postController.listPosts);

router.get('/:id', optionalAuth, postController.getPost);

router.post(
    '/',
    auth,
    [
        body('title').isLength({ min: 3 }).withMessage('title min 3 chars'),
        body('content').isLength({ min: 10 }).withMessage('content min 10 chars')
    ],
    postController.createPost
);

router.put(
    '/:id',
    auth,
    ownerOnly(async (req) => {
        const p = await Post.findById(req.params.id).select('author');
        return p ? p.author : null;
    }),
    postController.updatePost
);

router.delete(
    '/:id',
    auth,
    ownerOnly(async (req) => {
        const p = await Post.findById(req.params.id).select('author');
        return p ? p.author : null;
    }),
    postController.deletePost
);

router.post('/:id/tags', auth, postController.addTag);
router.delete('/:id/tags', auth, postController.removeTag);
router.post('/:id/like', auth, postController.toggleLike);

module.exports = router;