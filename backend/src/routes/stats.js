const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

router.get('/top-posts', statsController.topPosts);
router.get('/popular-tags', statsController.popularTags);
router.get('/posts-by-author', statsController.postsByAuthor);
router.get('/avg-comments-per-post', statsController.avgCommentsPerPost);
router.get('/monthly-posts', statsController.monthlyPosts);

module.exports = router;