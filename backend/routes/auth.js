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

const timeGate = require('../utils/timeGate');

// GET /api/auth/time-status
router.get('/time-status', (req, res) => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeVal = hour * 60 + minute;

  const startVal = 15 * 60 + 45; // 3:45 PM
  const endVal = 17 * 60 + 0;   // 5:00 PM
  const graceEndVal = 17 * 60 + 15; // 5:15 PM

  let status = 'open';
  let message = 'Dungeon Gates are Open!';
  let remainingSeconds = 0;

  if (!timeGate.TIME_GATE_ENABLED) {
    status = 'open';
    message = 'Time Gate Disabled';
  } else if (timeVal < startVal) {
    status = 'closed';
    message = 'Dungeon Gates are Locked';
    const target = new Date();
    target.setHours(15, 45, 0, 0);
    remainingSeconds = Math.max(0, Math.round((target.getTime() - now.getTime()) / 1000));
  } else if (timeVal >= startVal && timeVal < endVal) {
    status = 'open';
    message = 'Dungeon Gates are Open!';
    const target = new Date();
    target.setHours(17, 0, 0, 0);
    remainingSeconds = Math.max(0, Math.round((target.getTime() - now.getTime()) / 1000));
  } else if (timeVal >= endVal && timeVal <= graceEndVal) {
    status = 'grace';
    message = 'Grace Period Active (Progression Locked)';
    const target = new Date();
    target.setHours(17, 15, 0, 0);
    remainingSeconds = Math.max(0, Math.round((target.getTime() - now.getTime()) / 1000));
  } else {
    status = 'closed';
    message = 'Dungeon Closed';
  }

  res.json({
    success: true,
    enabled: timeGate.TIME_GATE_ENABLED,
    status,
    message,
    remainingSeconds
  });
});

module.exports = router;
