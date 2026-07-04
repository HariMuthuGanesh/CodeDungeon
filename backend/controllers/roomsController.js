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
      .select('id, room_order, title, topic, difficulty, points, section, type')
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

    const enriched = rooms.map((room) => {
      const cleared = clearedRoomIds.has(room.id);
      return {
        ...room,
        cleared,
        locked: false, // All chambers are open
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
      .select('id, room_order, title, topic, difficulty, points, problem_statement, section, type, shuffled_order')
      .eq('id', id)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    // Locking logic for section 3 has been removed to open all chambers.

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
