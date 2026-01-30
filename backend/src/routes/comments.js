const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const commentController = require('../controllers/commentController');
const { auth } = require('../middlewares/auth');

// create comment for post
router.post('/:postId', auth, [body('text').isLength({ min: 1 })], commentController.createComment);

// list comments for post
router.get('/:postId', commentController.listCommentsForPost);

// update comment
router.put('/comment/:id', auth, commentController.updateComment);

// delete comment
router.delete('/comment/:id', auth, commentController.deleteComment);

module.exports = router;
