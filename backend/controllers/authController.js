const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const supabase = require('../config/supabase');

/**
 * POST /api/auth/register
 * Body: { teamName, password, members[] }
 * Teams self-register — no admin approval needed.
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { teamName, password, members } = req.body;

    if (!teamName || teamName.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Team name must be at least 2 characters.' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters.' });
    }

    // Check if team name already taken
    const { data: existing } = await supabase
      .from('teams')
      .select('id')
      .eq('team_name', teamName.trim())
      .single();

    if (existing) {
      return res.status(409).json({ success: false, message: `Team name "${teamName}" is already taken. Choose another.` });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const membersArray = Array.isArray(members)
      ? members
      : (typeof members === 'string' ? members.split(',').map(m => m.trim()).filter(Boolean) : []);

    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        team_name: teamName.trim(),
        password: hashedPassword,
        members: membersArray,
      })
      .select('id, team_name, members, created_at')
      .single();

    if (error) throw error;

    // Auto-login — issue JWT immediately
    const token = jwt.sign(
      { teamId: team.id, teamName: team.team_name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: `Team "${team.team_name}" registered successfully!`,
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
 * POST /api/auth/login
 * Body: { teamName, password }
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { teamName, password } = req.body;

    const { data: team, error } = await supabase
      .from('teams')
      .select('id, team_name, password, members')
      .eq('team_name', teamName)
      .single();

    if (error || !team) {
      return res.status(401).json({ success: false, message: 'Invalid team name or password.' });
    }

    const isMatch = await bcrypt.compare(password, team.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid team name or password.' });
    }

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
 */
const me = (req, res) => {
  res.json({ success: true, team: req.team });
};

module.exports = { register, login, me };
