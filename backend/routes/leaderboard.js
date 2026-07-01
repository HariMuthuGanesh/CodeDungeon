const express = require('express');
const { getLeaderboard } = require('../controllers/leaderboardController');

const router = express.Router();

// GET /api/leaderboard  (public)
router.get('/', getLeaderboard);

module.exports = router;
