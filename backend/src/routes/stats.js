const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

router.get('/top-posts', statsController.topPosts);
router.get('/monthly-posts', statsController.monthlyPosts);

module.exports = router;