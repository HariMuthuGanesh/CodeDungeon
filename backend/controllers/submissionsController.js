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

    const timeGate = require('../utils/timeGate');
    // 1. Time Gate Check
    if (timeGate.isClosed()) {
      return res.status(403).json({
        success: false,
        message: 'The dungeon gates are locked! Submissions are only accepted between 3:45 PM and 5:15 PM.'
      });
    }

    const { teamId, teamName } = req.team;
    const { roomId, notes } = req.body;

    // Verify the room exists
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, room_order, title, type, correct_order, expected_pattern, points')
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

    // 2. Perform Automatic Evaluations (if applicable)
    let finalStatus = 'pending';
    let reviewNotes = null;
    let reviewedAt = null;
    let reviewDuration = null;

    if (room.type === 'rearrangement') {
      let isCorrect = false;
      let submittedOrderArray = [];
      try {
        submittedOrderArray = JSON.parse(notes);
      } catch (err) {
        submittedOrderArray = [];
      }
      
      const correctOrder = room.correct_order;
      if (correctOrder && Array.isArray(correctOrder) && correctOrder.length === submittedOrderArray.length) {
        isCorrect = correctOrder.every((val, index) => val === submittedOrderArray[index]);
      }
      
      finalStatus = isCorrect ? 'accepted' : 'rejected';
      reviewNotes = isCorrect ? 'Sequence match successful.' : 'Incorrect sequence.';
      reviewedAt = new Date().toISOString();
      reviewDuration = 0;
    } else if (room.type === 'coding_auto') {
      try {
        const judgeUrl = process.env.JUDGE_SERVER_URL || 'http://localhost:5001';
        const response = await fetch(`${judgeUrl}/judge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: notes, roomOrder: room.room_order })
        });
        
        if (!response.ok) {
          throw new Error(`Judge Server returned status ${response.status}`);
        }
        
        const judgeResult = await response.json();
        if (judgeResult.success) {
          finalStatus = judgeResult.passed ? 'accepted' : 'rejected';
          reviewNotes = judgeResult.notes;
        } else {
          finalStatus = 'rejected';
          reviewNotes = judgeResult.message || 'Auto evaluation failed.';
        }
      } catch (err) {
        console.error('Judge Server error:', err);
        return res.status(502).json({
          success: false,
          message: 'Dungeon automated judge is offline. Please try again later or contact organizer.'
        });
      }
      reviewedAt = new Date().toISOString();
      reviewDuration = 0;
    }

    // Create the submission
    let { data: submission, error: insertError } = await supabase
      .from('submissions')
      .insert({
        team_id: teamId,
        room_id: roomId,
        status: finalStatus,
        notes: notes || null,
        submitted_order: room.type === 'rearrangement' ? (notes ? JSON.parse(notes) : null) : null,
        reviewed_at: reviewedAt,
        review_duration: reviewDuration
      })
      .select(`
        id,
        status,
        notes,
        submitted_at,
        reviewed_at,
        review_duration,
        teams ( id, team_name ),
        rooms ( id, title, room_order, difficulty, points )
      `)
      .single();

    if (insertError) throw insertError;

    // 3. Socket Communications & Side Effects
    const io = getIO();

    if (finalStatus === 'accepted') {
      // Respect grace period time gate: only unlock if NOT in grace period
      if (timeGate.isGracePeriod()) {
        console.log(`[TimeGate] Grace period active. Accepted submission for team ${teamName} but room progression is locked.`);
      } else {
        if (io) {
          io.to(`team:${teamId}`).emit('room:unlocked', {
            roomId: submission.rooms.id,
            roomTitle: submission.rooms.title,
            points: submission.rooms.points,
          });
        }
      }

      // Broadcast updated leaderboard
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
    } else if (finalStatus === 'rejected') {
      if (io) {
        io.to(`team:${teamId}`).emit('submission:rejected', {
          roomId: submission.rooms.id,
          roomTitle: submission.rooms.title,
          message: reviewNotes || 'Your submission is incorrect. Try again.',
        });
      }
    } else {
      // Pending review - notify organizers via socket
      if (io) {
        io.emit('submission:new', submission);
      }
    }

    res.status(201).json({
      success: true,
      message: finalStatus === 'accepted' 
        ? 'Solution accepted! Room cleared.' 
        : finalStatus === 'rejected' 
        ? 'Solution rejected. Check compiler output/logs.' 
        : 'Submission received. Awaiting manual review.',
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
