/**
 * Socket.IO event bindings.
 * Called once during server startup with the `io` instance.
 */
const registerSocketEvents = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    /**
     * join:team
     * Teams call this after login to subscribe to their private room.
     * Payload: { teamId }
     */
    socket.on('join:team', ({ teamId }) => {
      if (!teamId) return;
      const room = `team:${teamId}`;
      socket.join(room);
      console.log(`[Socket] ${socket.id} joined room ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = { registerSocketEvents };
