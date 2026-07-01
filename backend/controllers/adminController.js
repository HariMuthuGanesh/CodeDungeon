const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { getIO } = require('../config/socket');

// ─── Teams ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/teams
 * Body: { teamName, password, members[] }
 * Creates a team with a hashed password.
 */
const createTeam = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { teamName, password, members } = req.body;

    // Hash the password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        team_name: teamName,
        password: hashedPassword,
        members: members || [],
      })
      .select('id, team_name, members, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ success: false, message: `Team "${teamName}" already exists.` });
      }
      throw error;
    }

    res.status(201).json({ success: true, team });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/teams
 * Returns all teams (without passwords).
 */
const getAllTeams = async (req, res, next) => {
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('id, team_name, members, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ success: true, teams });
  } catch (err) {
    next(err);
  }
};

// ─── Submissions ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/submissions
 * Query: ?status=pending|accepted|rejected
 */
const getAllSubmissions = async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('submissions')
      .select(`
        id,
        status,
        notes,
        submitted_at,
        reviewed_at,
        teams ( id, team_name ),
        rooms ( id, title, difficulty, points )
      `)
      .order('submitted_at', { ascending: true });

    if (status) query = query.eq('status', status);

    const { data: submissions, error } = await query;
    if (error) throw error;

    res.json({ success: true, submissions });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/submissions/:id/accept
 * Marks the submission as accepted.
 * Emits: leaderboard:update (all), room:unlocked (team room)
 */
const acceptSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Update submission status
    const { data: submission, error: updateError } = await supabase
      .from('submissions')
      .update({ status: 'accepted', reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        id, status,
        teams ( id, team_name ),
        rooms ( id, title, room_order, points )
      `)
      .single();

    if (updateError || !submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    const io = getIO();

    // Emit room:unlocked to the specific team's socket room
    io.to(`team:${submission.teams.id}`).emit('room:unlocked', {
      roomId: submission.rooms.id,
      roomTitle: submission.rooms.title,
      points: submission.rooms.points,
    });

    // Fetch fresh leaderboard and broadcast to everyone
    const { data: leaderboard } = await supabase.from('leaderboard').select('*');
    if (leaderboard) {
      io.emit('leaderboard:update', leaderboard.map((entry, idx) => ({
        rank: idx + 1,
        teamName: entry.team_name,
        roomsCleared: entry.rooms_cleared,
        totalPoints: entry.total_points,
        lastSubmissionAt: entry.last_submission_at,
      })));
    }

    res.json({
      success: true,
      message: `Submission accepted. ${submission.teams.team_name} cleared "${submission.rooms.title}".`,
      submission,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/submissions/:id/reject
 * Body: { reason? }
 * Marks the submission as rejected.
 * Emits: submission:rejected (team room)
 */
const rejectSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: submission, error: updateError } = await supabase
      .from('submissions')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        id, status,
        teams ( id, team_name ),
        rooms ( id, title )
      `)
      .single();

    if (updateError || !submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    const io = getIO();

    // Notify team their submission was rejected
    io.to(`team:${submission.teams.id}`).emit('submission:rejected', {
      roomId: submission.rooms.id,
      roomTitle: submission.rooms.title,
      message: reason || 'Your submission was rejected. Please review your solution and try again.',
    });

    res.json({
      success: true,
      message: `Submission rejected for team "${submission.teams.team_name}".`,
      submission,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Rooms (Admin) ─────────────────────────────────────────────────────────────

/**
 * POST /api/admin/rooms
 * Body: { room_order, title, topic, difficulty, points, problem_statement }
 */
const createRoom = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { room_order, title, topic, difficulty, points, problem_statement } = req.body;

    const { data: room, error } = await supabase
      .from('rooms')
      .insert({ room_order, title, topic, difficulty, points, problem_statement })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, room });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/rooms/:id
 * Update any field on a room (e.g., problem statement).
 */
const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent updating id
    delete updates.id;

    const { data: room, error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    res.json({ success: true, room });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/leaderboard
 * Full leaderboard including all details.
 */
const getAdminLeaderboard = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('leaderboard').select('*');
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

/**
 * GET /api/admin/rooms
 * Returns all rooms (including problem statements) for admin management.
 */
const getAllRoomsAdmin = async (req, res, next) => {
  try {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .order('room_order', { ascending: true });

    if (error) throw error;

    res.json({ success: true, rooms });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTeam,
  getAllTeams,
  getAllSubmissions,
  acceptSubmission,
  rejectSubmission,
  createRoom,
  updateRoom,
  getAdminLeaderboard,
  getAllRoomsAdmin,
};
