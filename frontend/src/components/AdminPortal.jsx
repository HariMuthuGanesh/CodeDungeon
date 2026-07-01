import { useState, useEffect, useCallback } from 'react';
import {
  adminGetRooms,
  adminCreateRoom,
  adminUpdateRoom,
  adminGetSubmissions,
  adminAcceptSubmission,
  adminRejectSubmission,
  adminGetTeams,
  adminCreateTeam,
  getLeaderboard,
} from '../services/api';
import { connectSocket } from '../services/socket';

export default function AdminPortal({ onLogout }) {
  const [activeTab, setActiveTab] = useState('submissions');
  const [rooms, setRooms] = useState([]);
  const [teams, setTeams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  // Queue state
  const [selectedSub, setSelectedSub] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Edit / Add Room state
  const [editingRoom, setEditingRoom] = useState(null);
  const [newRoom, setNewRoom] = useState({
    room_order: '',
    title: '',
    topic: '',
    difficulty: 'easy',
    points: '',
    problem_statement: '',
  });
  const [isAddingRoom, setIsAddingRoom] = useState(false);

  // Add Team state
  const [newTeam, setNewTeam] = useState({
    teamName: '',
    password: '',
    members: '',
  });
  const [teamError, setTeamError] = useState('');
  const [teamSuccess, setTeamSuccess] = useState('');

  const [notification, setNotification] = useState(null);

  // Notifications helper
  const showToast = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5050);
  };

  // Memoized fetch methods to avoid effect dependency loops
  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await adminGetSubmissions();
      if (res.success) {
        setSubmissions(res.submissions);
        // Retain selection if still in queue, else clear
        if (selectedSub) {
          const updated = res.submissions.find(s => s.id === selectedSub.id);
          setSelectedSub(updated || null);
        }
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  }, [selectedSub]);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await adminGetRooms();
      if (res.success) setRooms(res.rooms);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await adminGetTeams();
      if (res.success) setTeams(res.teams);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await getLeaderboard();
      if (res.success) setLeaderboard(res.leaderboard);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  }, []);

  const loadAllData = useCallback(() => {
    fetchSubmissions();
    fetchRooms();
    fetchTeams();
    fetchLeaderboard();
  }, [fetchSubmissions, fetchRooms, fetchTeams, fetchLeaderboard]);

  // Load Initial Data and bind sockets
  useEffect(() => {
    loadAllData();

    // Bind real-time socket events for live updates
    const socket = connectSocket('admin');
    if (socket) {
      socket.on('leaderboard:update', (updatedLeaderboard) => {
        setLeaderboard(updatedLeaderboard);
      });
      // Admin should also refresh list when submissions come in (via polling fallback)
    }

    const interval = setInterval(loadAllData, 20000);

    return () => {
      if (socket) {
        socket.off('leaderboard:update');
      }
      clearInterval(interval);
    };
  }, [loadAllData]);

  // Actions
  const handleAccept = async (subId) => {
    setActionLoading(true);
    try {
      const res = await adminAcceptSubmission(subId);
      if (res.success) {
        showToast('success', `Submission accepted! Next room unlocked.`);
        await loadAllData();
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to accept submission.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e, subId) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      showToast('error', 'Please provide a reason for rejection.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminRejectSubmission(subId, rejectReason);
      if (res.success) {
        showToast('success', `Submission rejected with feedback.`);
        setRejectReason('');
        await loadAllData();
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to reject submission.');
    } finally {
      setActionLoading(false);
    }
  };

  // Challenges Handlers
  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    try {
      const res = await adminUpdateRoom(editingRoom.id, {
        room_order: parseInt(editingRoom.room_order),
        title: editingRoom.title,
        topic: editingRoom.topic,
        difficulty: editingRoom.difficulty,
        points: parseInt(editingRoom.points),
        problem_statement: editingRoom.problem_statement,
      });
      if (res.success) {
        showToast('success', `Chamber "${editingRoom.title}" updated successfully.`);
        setEditingRoom(null);
        fetchRooms();
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to update challenge.');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const res = await adminCreateRoom({
        room_order: parseInt(newRoom.room_order),
        title: newRoom.title,
        topic: newRoom.topic,
        difficulty: newRoom.difficulty,
        points: parseInt(newRoom.points),
        problem_statement: newRoom.problem_statement,
      });
      if (res.success) {
        showToast('success', `Chamber "${newRoom.title}" created successfully.`);
        setNewRoom({
          room_order: '',
          title: '',
          topic: '',
          difficulty: 'easy',
          points: '',
          problem_statement: '',
        });
        setIsAddingRoom(false);
        fetchRooms();
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to add challenge.');
    }
  };

  // Teams Handlers
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setTeamError('');
    setTeamSuccess('');
    try {
      const membersArray = newTeam.members
        ? newTeam.members.split(',').map((m) => m.trim()).filter((m) => m.length > 0)
        : [];
      const res = await adminCreateTeam({
        teamName: newTeam.teamName,
        password: newTeam.password,
        members: membersArray,
      });
      if (res.success) {
        setTeamSuccess(`Team "${newTeam.teamName}" registered successfully!`);
        setNewTeam({ teamName: '', password: '', members: '' });
        fetchTeams();
      }
    } catch (err) {
      setTeamError(err.message || 'Failed to create team.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-50 max-w-sm p-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {notification.type === 'success' ? '🏆' : '❌'}
            </span>
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto text-gray-400 hover:text-white font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 bg-gray-900/30 border border-gray-800 rounded-2xl p-6 backdrop-blur-xl">
        <div>
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-500 to-indigo-500 tracking-tight">
            DUNGEON ORGANIZER
          </h1>
          <p className="text-xs uppercase tracking-widest text-gray-500 mt-1 font-semibold">
            Admin Management Console
          </p>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2.5 bg-gray-900 border border-gray-850 hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
        >
          Exit Admin Portal
        </button>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto mb-8 flex border-b border-gray-850 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`pb-4 px-4 font-semibold text-sm transition-all duration-200 relative whitespace-nowrap ${
            activeTab === 'submissions'
              ? 'text-purple-400 border-b-2 border-purple-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📥 Submissions Queue ({submissions.filter((s) => s.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`pb-4 px-4 font-semibold text-sm transition-all duration-200 relative whitespace-nowrap ${
            activeTab === 'challenges'
              ? 'text-purple-400 border-b-2 border-purple-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🧭 Challenges ({rooms.length})
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`pb-4 px-4 font-semibold text-sm transition-all duration-200 relative whitespace-nowrap ${
            activeTab === 'teams'
              ? 'text-purple-400 border-b-2 border-purple-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          👥 Teams ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-4 px-4 font-semibold text-sm transition-all duration-200 relative whitespace-nowrap ${
            activeTab === 'leaderboard'
              ? 'text-purple-400 border-b-2 border-purple-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🥇 Standings
        </button>
      </div>

      <main className="max-w-7xl mx-auto">
        {/* Tab content: Submissions Queue */}
        {activeTab === 'submissions' && (
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
            <div className="lg:col-span-4 bg-gray-900/20 border border-gray-800 rounded-2xl p-5 backdrop-blur-xl h-[calc(100vh-270px)] overflow-y-auto">
              <h3 className="font-bold text-lg mb-4 text-gray-300">Pending Review</h3>
              <div className="space-y-3">
                {submissions.filter(s => s.status === 'pending').map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSelectedSub(sub);
                      setRejectReason('');
                    }}
                    className={`w-full text-left p-4 border rounded-xl transition-all duration-300 block ${
                      selectedSub?.id === sub.id
                        ? 'border-purple-500 bg-purple-950/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                        : 'border-gray-850 bg-gray-900/30 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-white text-sm">{sub.teams?.team_name}</span>
                      <span className="font-mono text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                        Room {sub.rooms?.room_order}
                      </span>
                    </div>
                    <span className="text-xs text-gray-300 block mt-1">{sub.rooms?.title}</span>
                    <span className="text-[10px] text-gray-500 block mt-3 font-mono">
                      Submitted: {new Date(sub.submitted_at).toLocaleTimeString()}
                    </span>
                  </button>
                ))}
                {submissions.filter(s => s.status === 'pending').length === 0 && (
                  <p className="text-gray-500 text-center font-mono text-sm py-12">
                    Queue is empty. No pending submissions.
                  </p>
                )}
              </div>

              <h3 className="font-bold text-sm text-gray-400 mt-8 mb-4 border-t border-gray-850 pt-6">
                Reviewed Submissions
              </h3>
              <div className="space-y-2 opacity-65">
                {submissions.filter(s => s.status !== 'pending').slice(0, 15).map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 border border-gray-850/50 bg-gray-950/20 rounded-lg flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-semibold block text-gray-300">{sub.teams?.team_name}</span>
                      <span className="text-gray-500">{sub.rooms?.title}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      sub.status === 'accepted'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col h-[calc(100vh-270px)]">
              {selectedSub ? (
                <div className="bg-gray-900/20 border border-gray-800 rounded-2xl p-6 backdrop-blur-xl flex flex-col h-full overflow-y-auto">
                  <div className="pb-4 border-b border-gray-800 flex justify-between items-start gap-4">
                    <div>
                      <span className="text-xs font-mono uppercase tracking-widest text-purple-400">
                        Reviewing Submission
                      </span>
                      <h2 className="text-2xl font-black mt-1 text-white">
                        {selectedSub.teams?.team_name}
                      </h2>
                      <span className="text-xs text-gray-400 mt-0.5 block">
                        Chamber {selectedSub.rooms?.room_order}: {selectedSub.rooms?.title}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-gray-500 block font-mono">
                        Time: {new Date(selectedSub.submitted_at).toLocaleTimeString()}
                      </span>
                      <span className="text-xs text-purple-400 font-bold mt-1 block">
                        +{selectedSub.rooms?.points} Pts
                      </span>
                    </div>
                  </div>

                  {/* Submitted Code */}
                  <div className="my-6 flex-grow flex flex-col">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 font-mono">
                      Submitted Code / Notes
                    </h4>
                    <pre className="w-full flex-grow p-4 bg-gray-950 border border-gray-850 rounded-xl text-xs overflow-auto text-emerald-400 font-mono leading-relaxed max-h-96 min-h-48 whitespace-pre-wrap">
                      {selectedSub.notes || '// No code uploaded.'}
                    </pre>
                  </div>

                  {/* Approval Actions */}
                  <div className="pt-4 border-t border-gray-800 flex flex-col md:flex-row items-end gap-6">
                    <div className="w-full md:flex-grow">
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 font-mono">
                        Rejection Reason (only for Rejections)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Code fails case 3, missing recursive case"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                      <button
                        onClick={(e) => handleReject(e, selectedSub.id)}
                        disabled={actionLoading}
                        className="flex-1 md:flex-none px-6 py-2.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleAccept(selectedSub.id)}
                        disabled={actionLoading}
                        className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                      >
                        Accept & Unlock
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900/20 border border-gray-800 rounded-2xl p-12 text-center text-gray-500 backdrop-blur-xl h-full flex flex-col justify-center items-center">
                  <span className="text-4xl block mb-3">📥</span>
                  <p className="font-medium">Select a team submission from the left queue to review.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab content: Challenges */}
        {activeTab === 'challenges' && (
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
            {/* Rooms list */}
            <div className="lg:col-span-5 bg-gray-900/20 border border-gray-800 rounded-2xl p-5 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-gray-300">Seeded Chambers</h3>
                <button
                  onClick={() => {
                    setIsAddingRoom(true);
                    setEditingRoom(null);
                  }}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  + Add Challenge
                </button>
              </div>

              <div className="space-y-3">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-4 border border-gray-850 bg-gray-900/30 rounded-xl flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                          Room {room.room_order}
                        </span>
                        <span className="font-bold text-sm text-white">{room.title}</span>
                      </div>
                      <span className="text-xs text-gray-400 block mt-1">
                        Topic: {room.topic} • Points: {room.points} • {room.difficulty}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setEditingRoom(room);
                        setIsAddingRoom(false);
                      }}
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Room editor / creation panel */}
            <div className="lg:col-span-5">
              {editingRoom ? (
                <div className="bg-gray-900/20 border border-gray-800 rounded-2xl p-6 backdrop-blur-xl">
                  <h3 className="font-bold text-lg mb-4 text-purple-400">Edit Chamber {editingRoom.room_order}</h3>
                  <form onSubmit={handleUpdateRoom} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Room Order</label>
                        <input
                          type="number"
                          value={editingRoom.room_order}
                          onChange={(e) => setEditingRoom({ ...editingRoom, room_order: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Title</label>
                        <input
                          type="text"
                          value={editingRoom.title}
                          onChange={(e) => setEditingRoom({ ...editingRoom, title: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-400 mb-1">Topic</label>
                        <input
                          type="text"
                          value={editingRoom.topic}
                          onChange={(e) => setEditingRoom({ ...editingRoom, topic: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Difficulty</label>
                        <select
                          value={editingRoom.difficulty}
                          onChange={(e) => setEditingRoom({ ...editingRoom, difficulty: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                          <option value="boss">Boss</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Points</label>
                      <input
                        type="number"
                        value={editingRoom.points}
                        onChange={(e) => setEditingRoom({ ...editingRoom, points: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Problem Statement</label>
                      <textarea
                        value={editingRoom.problem_statement || ''}
                        onChange={(e) => setEditingRoom({ ...editingRoom, problem_statement: e.target.value })}
                        className="w-full h-48 p-3 bg-gray-950 border border-gray-800 rounded-lg text-xs font-mono leading-relaxed"
                        placeholder="Write challenge markdown/text here..."
                        required
                      />
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingRoom(null)}
                        className="px-4 py-2 bg-gray-850 hover:bg-gray-800 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-bold"
                      >
                        Save Updates
                      </button>
                    </div>
                  </form>
                </div>
              ) : isAddingRoom ? (
                <div className="bg-gray-900/20 border border-gray-800 rounded-2xl p-6 backdrop-blur-xl">
                  <h3 className="font-bold text-lg mb-4 text-purple-400">Add New Challenge</h3>
                  <form onSubmit={handleCreateRoom} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Room Order</label>
                        <input
                          type="number"
                          placeholder="e.g. 6"
                          value={newRoom.room_order}
                          onChange={(e) => setNewRoom({ ...newRoom, room_order: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Maze of Recursion"
                          value={newRoom.title}
                          onChange={(e) => setNewRoom({ ...newRoom, title: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-400 mb-1">Topic</label>
                        <input
                          type="text"
                          placeholder="Recursion"
                          value={newRoom.topic}
                          onChange={(e) => setNewRoom({ ...newRoom, topic: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Difficulty</label>
                        <select
                          value={newRoom.difficulty}
                          onChange={(e) => setNewRoom({ ...newRoom, difficulty: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                          <option value="boss">Boss</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Points</label>
                      <input
                        type="number"
                        placeholder="e.g. 50"
                        value={newRoom.points}
                        onChange={(e) => setNewRoom({ ...newRoom, points: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Problem Statement</label>
                      <textarea
                        value={newRoom.problem_statement}
                        onChange={(e) => setNewRoom({ ...newRoom, problem_statement: e.target.value })}
                        className="w-full h-48 p-3 bg-gray-950 border border-gray-800 rounded-lg text-xs font-mono leading-relaxed"
                        placeholder="Write challenge markdown/text here..."
                        required
                      />
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsAddingRoom(false)}
                        className="px-4 py-2 bg-gray-850 hover:bg-gray-800 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-bold"
                      >
                        Create Challenge
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-gray-900/20 border border-gray-800 rounded-2xl p-12 text-center text-gray-500 backdrop-blur-xl h-full flex flex-col justify-center items-center">
                  <span className="text-4xl block mb-3">🛠️</span>
                  <p>Select a challenge to edit, or add a new one.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab content: Teams */}
        {activeTab === 'teams' && (
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
            <div className="lg:col-span-6 bg-gray-900/20 border border-gray-800 rounded-2xl p-5 backdrop-blur-xl h-[calc(100vh-270px)] overflow-y-auto">
              <h3 className="font-bold text-lg mb-4 text-gray-300">Registered Teams</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-850 text-xs text-gray-500 uppercase font-mono">
                      <th className="py-3 px-2">Team Name</th>
                      <th className="py-3 px-2">Members</th>
                      <th className="py-3 px-2 text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850/30">
                    {teams.map((t) => (
                      <tr key={t.id} className="text-sm hover:bg-gray-900/10">
                        <td className="py-3 px-2 font-bold text-white">{t.team_name}</td>
                        <td className="py-3 px-2 text-gray-300 text-xs">
                          {t.members && t.members.length > 0 ? t.members.join(', ') : 'No members'}
                        </td>
                        <td className="py-3 px-2 text-right text-gray-500 text-xs font-mono">
                          {new Date(t.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {teams.length === 0 && (
                      <tr>
                        <td colSpan="3" className="py-8 text-center text-gray-500 font-mono text-xs">
                          No teams registered yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Create Team Form */}
            <div className="lg:col-span-4 bg-gray-900/20 border border-gray-800 rounded-2xl p-6 backdrop-blur-xl">
              <h3 className="font-bold text-lg mb-4 text-purple-400">Register New Team</h3>
              
              <form onSubmit={handleCreateTeam} className="space-y-4">
                {teamError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-xs">
                    {teamError}
                  </div>
                )}
                {teamSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs">
                    {teamSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Team Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Binary Beasts"
                    value={newTeam.teamName}
                    onChange={(e) => setNewTeam({ ...newTeam, teamName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Access Code / Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter access code"
                    value={newTeam.password}
                    onChange={(e) => setNewTeam({ ...newTeam, password: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Members (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe, Alice Smith"
                    value={newTeam.members}
                    onChange={(e) => setNewTeam({ ...newTeam, members: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 font-bold text-xs uppercase tracking-wider rounded-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 text-white cursor-pointer"
                >
                  Register Team
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab content: Standings */}
        {activeTab === 'leaderboard' && (
          <div className="max-w-4xl mx-auto bg-gray-900/20 border border-gray-800 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              🏆 Live Standings
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-widest font-mono">
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-3">Team Name</th>
                    <th className="py-3 px-3 text-center">Rooms Cleared</th>
                    <th className="py-3 px-3 text-right">Total Points</th>
                    <th className="py-3 px-3 text-right">Last Cleared Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850/50">
                  {leaderboard.map((row) => (
                    <tr
                      key={row.teamName}
                      className="text-sm text-gray-300 hover:bg-gray-900/10 transition-colors"
                    >
                      <td className="py-3.5 px-3 font-mono">
                        {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : `#${row.rank}`}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-white">{row.teamName}</td>
                      <td className="py-3.5 px-3 text-center font-mono">{row.roomsCleared}</td>
                      <td className="py-3.5 px-3 text-right font-mono text-purple-400 font-bold">
                        {row.totalPoints}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-gray-500 text-xs">
                        {row.lastSubmissionAt
                          ? new Date(row.lastSubmissionAt).toLocaleTimeString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                  {leaderboard.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-650 font-mono text-xs">
                        No active teams registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
