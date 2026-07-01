const express = require('express');
const { body } = require('express-validator');
const { login, me } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post(
  '/login',
  [
    body('teamName').trim().notEmpty().withMessage('Team name is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  login
);

// GET /api/auth/me  (protected)
router.get('/me', auth, me);

module.exports = router;
