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

    // Determine which rooms are accessible:
    // Section 1 (rooms 1-3) and Section 2 (rooms 4-6) are fully unlocked.
    // Section 3 (room 7) is locked until all 6 rooms from Sections 1 and 2 are cleared.
    
    // We expect rooms 1,2,3,4,5,6 to be cleared for section 3 to unlock
    // Get all rooms that belong to section 1 and 2:
    const requiredRoomIds = rooms.filter(r => r.section === 1 || r.section === 2).map(r => r.id);
    const hasClearedAllRequired = requiredRoomIds.every(id => clearedRoomIds.has(id));

    const enriched = rooms.map((room) => {
      const cleared = clearedRoomIds.has(room.id);
      let locked = false;
      if (room.section === 3) {
        locked = !hasClearedAllRequired;
      }
      return {
        ...room,
        cleared,
        locked,
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

    // Check locking logic for section 3
    if (room.section === 3) {
      // Find all required rooms from section 1 and 2
      const { data: requiredRooms } = await supabase
        .from('rooms')
        .select('id')
        .in('section', [1, 2]);

      const requiredIds = requiredRooms.map(r => r.id);
      
      const { data: acceptedSubmissions } = await supabase
        .from('submissions')
        .select('room_id')
        .eq('team_id', teamId)
        .eq('status', 'accepted')
        .in('room_id', requiredIds);

      if (acceptedSubmissions.length < requiredIds.length) {
        return res.status(403).json({ success: false, message: 'Section 3 is locked. Complete all challenges in Sections 1 and 2 first!' });
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
