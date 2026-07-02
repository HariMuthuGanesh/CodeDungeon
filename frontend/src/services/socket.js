/**
 * Socket.IO client singleton.
 * Call connect(teamId) after login, disconnect() on logout.
 */

import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = (teamId) => {
  if (socket) {
    if (socket.connected && teamId) {
      socket.emit('join:team', { teamId });
    }
    return socket;
  }

  socket = io(API_URL, { transports: ['websocket'] });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
    if (teamId) {
      socket.emit('join:team', { teamId });
    }
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
