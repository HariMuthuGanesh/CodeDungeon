/**
 * Central API service — all backend calls go through here.
 * Token is automatically read from localStorage.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getToken = () => localStorage.getItem('cd_token');

const request = async (path, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const login = (teamName, password) =>
  request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ teamName, password }),
  });

export const getMe = () => request('/api/auth/me');

// ─── Rooms ────────────────────────────────────────────────────────────────────
export const getRooms = () => request('/api/rooms');
export const getRoom = (id) => request(`/api/rooms/${id}`);

// ─── Submissions ──────────────────────────────────────────────────────────────
export const submitRoom = (roomId, notes) =>
  request('/api/submissions', {
    method: 'POST',
    body: JSON.stringify({ roomId, notes }),
  });

export const getMySubmissions = () => request('/api/submissions/mine');

// ─── Leaderboard ──────────────────────────────────────────────────────────────
export const getLeaderboard = () => request('/api/leaderboard');
