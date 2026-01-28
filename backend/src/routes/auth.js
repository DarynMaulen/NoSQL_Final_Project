const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register
router.post(
  '/register',
  [
    body('username').isLength({ min: 3 }).withMessage('username min 3 chars'),
    body('email').isEmail().withMessage('invalid email'),
    body('password').isLength({ min: 6 }).withMessage('password min 6 chars')
  ],
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('invalid email'),
    body('password').exists().withMessage('password required')
  ],
  authController.login
);

module.exports = router;