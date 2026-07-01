// Shared Socket.IO instance.
// Populated by server.js after io is created so controllers can emit without circular imports.
let _io = null;

const setIO = (io) => { _io = io; };
const getIO = () => {
  if (!_io) throw new Error('Socket.IO has not been initialised yet.');
  return _io;
};

module.exports = { setIO, getIO };
