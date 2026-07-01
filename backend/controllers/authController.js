const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const supabase = require('../config/supabase');

/**
 * POST /api/auth/login
 * Body: { teamName, password }
 * Returns: { success, token, team }
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { teamName, password } = req.body;

    // Fetch team from DB
    const { data: team, error } = await supabase
      .from('teams')
      .select('id, team_name, password, members')
      .eq('team_name', teamName)
      .single();

    if (error || !team) {
      return res.status(401).json({ success: false, message: 'Invalid team name or password.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, team.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid team name or password.' });
    }

    // Issue JWT
    const token = jwt.sign(
      { teamId: team.id, teamName: team.team_name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      team: {
        id: team.id,
        teamName: team.team_name,
        members: team.members,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Returns the current team from the JWT (no DB call needed).
 */
const me = (req, res) => {
  res.json({ success: true, team: req.team });
};

module.exports = { login, me };
