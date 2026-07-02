const { validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { getIO } = require('../config/socket');

/**
 * POST /api/submissions
 * Body: { roomId, notes? }
 * Creates a pending submission for the authenticated team.
 */
const createSubmission = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { teamId, teamName } = req.team;
    const { roomId, notes } = req.body;

    // Verify the room exists
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, room_order, title')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    // Prevent duplicate submissions if already accepted
    const { data: existing } = await supabase
      .from('submissions')
      .select('id, status')
      .eq('team_id', teamId)
      .eq('room_id', roomId)
      .eq('status', 'accepted')
      .single();

    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already cleared this room.' });
    }

    // Check room is unlocked (room_order > 1 → previous must be accepted)
    if (room.room_order > 1) {
      const { data: prevRoom } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_order', room.room_order - 1)
        .single();

      if (prevRoom) {
        const { data: prevCleared } = await supabase
          .from('submissions')
          .select('id')
          .eq('team_id', teamId)
          .eq('room_id', prevRoom.id)
          .eq('status', 'accepted')
          .single();

        if (!prevCleared) {
          return res.status(403).json({ success: false, message: 'Previous room must be cleared first.' });
        }
      }
    }

    // Create the submission
    let { data: submission, error: insertError } = await supabase
      .from('submissions')
      .insert({
        team_id: teamId,
        room_id: roomId,
        status: 'pending',
        notes: notes || null,
      })
      .select(`
        id,
        status,
        notes,
        submitted_at,
        reviewed_at,
        teams ( team_name ),
        rooms ( id, title, difficulty, points )
      `)
      .single();

    if (insertError) throw insertError;

    // Notify organizers of new pending submission via socket
    const io = getIO();
    if (io) {
      io.emit('submission:new', submission);
    }

    res.status(201).json({
      success: true,
      message: 'Submission received. Awaiting review.',
      submission,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/submissions/mine
 * Returns all submissions for the authenticated team.
 */
const getMySubmissions = async (req, res, next) => {
  try {
    const { teamId } = req.team;

    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        id,
        status,
        notes,
        submitted_at,
        reviewed_at,
        rooms ( id, title, difficulty, points )
      `)
      .eq('team_id', teamId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, submissions });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSubmission, getMySubmissions };
