/**
 * Central API service — all backend calls go through here.
 * Token is automatically read from localStorage.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getToken = () => localStorage.getItem('cd_token');
const getAdminSecret = () => localStorage.getItem('cd_admin_secret');

const request = async (path, options = {}) => {
  const token = getToken();
  const adminSecret = getAdminSecret();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(adminSecret ? { 'x-admin-secret': adminSecret } : {}),
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
export const register = (teamName, password, members) =>
  request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ teamName, password, members }),
  });

export const login = (teamName, password) =>
  request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ teamName, password }),
  });

export const getMe = () => request('/api/auth/me');

export const getTimeStatus = () => request('/api/auth/time-status');

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

// ─── Admin Endpoints ──────────────────────────────────────────────────────────
export const adminGetRooms = () => request('/api/admin/rooms');

export const adminCreateRoom = (roomData) =>
  request('/api/admin/rooms', {
    method: 'POST',
    body: JSON.stringify(roomData),
  });

export const adminUpdateRoom = (id, updates) =>
  request(`/api/admin/rooms/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });

export const adminGetSubmissions = (status) => {
  const query = status ? `?status=${status}` : '';
  return request(`/api/admin/submissions${query}`);
};

export const adminAcceptSubmission = (id) =>
  request(`/api/admin/submissions/${id}/accept`, {
    method: 'PATCH',
  });

export const adminRejectSubmission = (id, reason) =>
  request(`/api/admin/submissions/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });

export const adminGetTeams = () => request('/api/admin/teams');

export const adminCreateTeam = (teamData) =>
  request('/api/admin/teams', {
    method: 'POST',
    body: JSON.stringify(teamData),
  });

export const adminGetScoreboards = () => request('/api/admin/scoreboards');

