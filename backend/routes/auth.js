const express = require('express');
const { body } = require('express-validator');
const { register, login, me } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register  — Teams self-register (public)
router.post(
  '/register',
  [
    body('teamName').trim().notEmpty().withMessage('Team name is required.'),
    body('password').isLength({ min: 4 }).withMessage('Password must be at least 4 characters.'),
  ],
  register
);

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
