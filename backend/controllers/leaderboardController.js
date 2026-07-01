const { validationResult } = require('express-validator');
const supabase = require('../config/supabase');

/**
 * GET /api/leaderboard
 * Public — no auth required.
 * Returns teams ranked by total points, then by earliest last submission time.
 */
const getLeaderboard = async (req, res, next) => {
  try {
    // Use the leaderboard view created in Supabase
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*');

    if (error) throw error;

    const ranked = data.map((entry, idx) => ({
      rank: idx + 1,
      teamName: entry.team_name,
      roomsCleared: entry.rooms_cleared,
      totalPoints: entry.total_points,
      lastSubmissionAt: entry.last_submission_at,
    }));

    res.json({ success: true, leaderboard: ranked });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLeaderboard };
