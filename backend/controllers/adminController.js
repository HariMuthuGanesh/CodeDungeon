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
/**
 * PATCH /api/admin/submissions/:id/accept
 * Marks the submission as accepted.
 * Emits: leaderboard:update (all), room:unlocked (team room) if not grace period
 */
const acceptSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch the submission first to get submitted_at
    const { data: currentSub, error: fetchErr } = await supabase
      .from('submissions')
      .select('submitted_at, team_id, room_id')
      .eq('id', id)
      .single();

    if (fetchErr || !currentSub) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    const reviewed_at = new Date().toISOString();
    const submittedAtDate = new Date(currentSub.submitted_at);
    const reviewedAtDate = new Date(reviewed_at);
    const review_duration = Math.max(0, Math.round((reviewedAtDate - submittedAtDate) / 1000)); // in seconds

    // Update submission status
    const { data: submission, error: updateError } = await supabase
      .from('submissions')
      .update({ 
        status: 'accepted', 
        reviewed_at,
        review_duration
      })
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

    // Respect grace period time gate: only unlock if NOT in grace period
    const timeGate = require('../utils/timeGate');
    if (timeGate.isGracePeriod()) {
      console.log(`[TimeGate] Grace period active. Accepted submission for team ${submission.teams.team_name} but room progression is locked.`);
    } else {
      // Emit room:unlocked to the specific team's socket room
      if (io) {
        io.to(`team:${submission.teams.id}`).emit('room:unlocked', {
          roomId: submission.rooms.id,
          roomTitle: submission.rooms.title,
          points: submission.rooms.points,
        });
      }
    }

    // Fetch fresh leaderboard and broadcast to everyone
    if (io) {
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

    // Fetch the submission first to get submitted_at
    const { data: currentSub, error: fetchErr } = await supabase
      .from('submissions')
      .select('submitted_at')
      .eq('id', id)
      .single();

    if (fetchErr || !currentSub) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    const reviewed_at = new Date().toISOString();
    const submittedAtDate = new Date(currentSub.submitted_at);
    const reviewedAtDate = new Date(reviewed_at);
    const review_duration = Math.max(0, Math.round((reviewedAtDate - submittedAtDate) / 1000)); // in seconds

    const { data: submission, error: updateError } = await supabase
      .from('submissions')
      .update({ 
        status: 'rejected', 
        reviewed_at,
        review_duration,
        notes: reason || null
      })
      .eq('id', id)
      .select(`
        id, status, notes,
        teams ( id, team_name ),
        rooms ( id, title )
      `)
      .single();

    if (updateError || !submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    const io = getIO();

    // Notify team their submission was rejected
    if (io) {
      io.to(`team:${submission.teams.id}`).emit('submission:rejected', {
        roomId: submission.rooms.id,
        roomTitle: submission.rooms.title,
        message: reason || 'Your submission was rejected. Please review your solution and try again.',
      });
    }

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

/**
 * GET /api/admin/scoreboards
 * Returns Scoreboard A (Sections 1+2) and Scoreboard B (Section 3) data.
 */
const getAdminScoreboards = async (req, res, next) => {
  try {
    // 1. Fetch all teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, team_name');
    if (teamsError) throw teamsError;

    // 2. Fetch all rooms
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, room_order, title, points, section');
    if (roomsError) throw roomsError;

    // 3. Fetch all submissions
    const { data: submissions, error: subsError } = await supabase
      .from('submissions')
      .select('id, team_id, room_id, status, submitted_at, reviewed_at, review_duration');
    if (subsError) throw subsError;

    const roomMap = new Map(rooms.map(r => [r.id, r]));

    const teamSubsMap = new Map();
    teams.forEach(t => teamSubsMap.set(t.id, []));
    submissions.forEach(s => {
      const list = teamSubsMap.get(s.team_id) || [];
      list.push(s);
      teamSubsMap.set(s.team_id, list);
    });

    const scoreboardA = [];
    const scoreboardB = [];

    teams.forEach(t => {
      const teamSubs = teamSubsMap.get(t.id) || [];

      // Partition submissions by scoreboard sections
      const subsA = teamSubs.filter(s => {
        const r = roomMap.get(s.room_id);
        return r && (r.section === 1 || r.section === 2);
      });
      const subsB = teamSubs.filter(s => {
        const r = roomMap.get(s.room_id);
        return r && r.section === 3;
      });

      const computeStats = (subs, targetSections) => {
        const accepted = subs.filter(s => s.status === 'accepted');
        
        // Compute total points from unique accepted rooms
        const uniqueAcceptedRoomIds = new Set(accepted.map(s => s.room_id));
        let score = 0;
        uniqueAcceptedRoomIds.forEach(rid => {
          const r = roomMap.get(rid);
          if (r) score += r.points;
        });

        // Reviewed count (accepted or rejected)
        const reviewed = subs.filter(s => s.status === 'accepted' || s.status === 'rejected');
        const submissionsReviewed = reviewed.length;

        // Average review duration (excluding auto-evals with duration 0 unless wanted, let's include all reviewed)
        let totalTime = 0;
        let counted = 0;
        reviewed.forEach(s => {
          if (s.review_duration !== null && s.review_duration !== undefined) {
            totalTime += s.review_duration;
            counted++;
          }
        });
        const averageReviewTime = counted > 0 ? Math.round(totalTime / counted) : 0;

        // Progress text
        let progress = 'Not Started';
        const clearedRoomOrders = accepted.map(s => {
          const r = roomMap.get(s.room_id);
          return r ? r.room_order : 0;
        });
        if (clearedRoomOrders.length > 0) {
          const maxOrder = Math.max(...clearedRoomOrders);
          progress = `Cleared Room ${maxOrder}`;
        } else {
          // Check if any room is unlocked/available
          // (a team has started if they have any submission, or we can look up their highest attempted room)
          const attempted = subs.map(s => {
            const r = roomMap.get(s.room_id);
            return r ? r.room_order : 0;
          });
          if (attempted.length > 0) {
            progress = `Attempting Room ${Math.max(...attempted)}`;
          }
        }

        return {
          teamName: t.team_name,
          score,
          submissionsReviewed,
          averageReviewTime,
          progress
        };
      };

      scoreboardA.push(computeStats(subsA, [1, 2]));
      scoreboardB.push(computeStats(subsB, [3]));
    });

    const sortScoreboard = (sb) => sb.sort((a, b) => b.score - a.score || a.teamName.localeCompare(b.teamName));

    res.json({
      success: true,
      scoreboardA: sortScoreboard(scoreboardA),
      scoreboardB: sortScoreboard(scoreboardB)
    });
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
  getAdminScoreboards,
};
