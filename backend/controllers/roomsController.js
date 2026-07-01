const supabase = require('../config/supabase');

/**
 * GET /api/rooms
 * Returns all rooms (without problem statements) for the authenticated team.
 * Each room includes whether the team has cleared it.
 */
const getAllRooms = async (req, res, next) => {
  try {
    const { teamId } = req.team;

    // Fetch all rooms ordered by room_order
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, room_order, title, topic, difficulty, points')
      .order('room_order', { ascending: true });

    if (roomsError) throw roomsError;

    // Fetch this team's accepted submissions
    const { data: accepted, error: subError } = await supabase
      .from('submissions')
      .select('room_id')
      .eq('team_id', teamId)
      .eq('status', 'accepted');

    if (subError) throw subError;

    const clearedRoomIds = new Set(accepted.map((s) => s.room_id));

    // Determine which rooms are accessible:
    // Room 1 is always open; subsequent rooms open only after previous is cleared.
    const enriched = rooms.map((room, idx) => {
      const cleared = clearedRoomIds.has(room.id);
      const previousCleared = idx === 0 || clearedRoomIds.has(rooms[idx - 1].id);
      return {
        ...room,
        cleared,
        locked: !previousCleared,
      };
    });

    res.json({ success: true, rooms: enriched });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/rooms/:id
 * Returns full room detail including problem_statement.
 * Only accessible if the room is unlocked for the team.
 */
const getRoomById = async (req, res, next) => {
  try {
    const { teamId } = req.team;
    const { id } = req.params;

    // Get the room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, room_order, title, topic, difficulty, points, problem_statement')
      .eq('id', id)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    // If it's not the first room, check the previous room is cleared
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
          return res.status(403).json({ success: false, message: 'This room is still locked. Clear the previous room first.' });
        }
      }
    }

    // Check if team already cleared this room
    const { data: cleared } = await supabase
      .from('submissions')
      .select('id')
      .eq('team_id', teamId)
      .eq('room_id', room.id)
      .eq('status', 'accepted')
      .single();

    res.json({
      success: true,
      room: {
        ...room,
        cleared: !!cleared,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllRooms, getRoomById };
