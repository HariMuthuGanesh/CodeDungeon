import { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import AdminPortal from './components/AdminPortal';
import { disconnectSocket, connectSocket } from './services/socket';
import { getRooms, getRoom, submitRoom, getMySubmissions, getLeaderboard } from './services/api';

// Restore session from localStorage on page reload
const getSavedSession = () => {
  const token    = localStorage.getItem('cd_token');
  const teamId   = localStorage.getItem('cd_team_id');
  const teamName = localStorage.getItem('cd_team_name');
  if (token && teamId && teamName) {
    return { id: teamId, teamName };
  }
  return null;
};

const getSavedAdminSession = () => {
  return localStorage.getItem('cd_admin_secret') || null;
};

function App() {
  const [team, setTeam] = useState(getSavedSession);
  const [adminSecret, setAdminSecret] = useState(getSavedAdminSession);
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [activeRoomDetail, setActiveRoomDetail] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const handleLogin = (teamData) => {
    setTeam(teamData);
  };

  const handleAdminLogin = (secret) => {
    setAdminSecret(secret);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('cd_admin_secret');
    setAdminSecret(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('cd_token');
    localStorage.removeItem('cd_team_id');
    localStorage.removeItem('cd_team_name');
    disconnectSocket();
    setTeam(null);
    setRooms([]);
    setActiveRoomId(null);
    setActiveRoomDetail(null);
    setSubmissions([]);
    setLeaderboard([]);
  };

  // Memoize refreshAllData so it doesn't trigger effect re-runs
  const refreshAllData = useCallback(async () => {
    try {
      const roomsRes = await getRooms();
      if (roomsRes.success) {
        setRooms(roomsRes.rooms);
        // Default active room to the current unlocked but uncleared chamber
        const activeRoom = roomsRes.rooms.find(r => !r.locked && !r.cleared) || roomsRes.rooms[0];
        if (activeRoom && !activeRoomId) {
          setActiveRoomId(activeRoom.id);
        }
      }

      const subsRes = await getMySubmissions();
      if (subsRes.success) {
        setSubmissions(subsRes.submissions);
      }

      const lbRes = await getLeaderboard();
      if (lbRes.success) {
        setLeaderboard(lbRes.leaderboard);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  }, [activeRoomId]);

  // Connect socket and load data
  useEffect(() => {
    if (!team) return;

    // Connect socket and register listeners
    const socket = connectSocket(team.id);
    if (socket) {
      setSocketConnected(socket.connected);

      socket.on('connect', () => {
        setSocketConnected(true);
      });

      socket.on('disconnect', () => {
        setSocketConnected(false);
      });

      socket.on('room:unlocked', (payload) => {
        setNotification({
          type: 'success',
          message: `Chamber "${payload.roomTitle}" cleared! +${payload.points} pts!`,
        });
        refreshAllData();
      });

      socket.on('submission:rejected', (payload) => {
        setNotification({
          type: 'error',
          message: `Submission for "${payload.roomTitle}" rejected: ${payload.message}`,
        });
        refreshAllData();
      });

      socket.on('leaderboard:update', (updatedLeaderboard) => {
        setLeaderboard(updatedLeaderboard);
      });
    }

    refreshAllData();

    // Standby polling backup
    const interval = setInterval(refreshAllData, 30000);

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('room:unlocked');
        socket.off('submission:rejected');
        socket.off('leaderboard:update');
      }
      clearInterval(interval);
    };
  }, [team, refreshAllData]);

  // Fetch active room detail on change
  useEffect(() => {
    if (!activeRoomId) {
      setActiveRoomDetail(null);
      return;
    }
    let isMounted = true;
    const fetchDetail = async () => {
      try {
        const data = await getRoom(activeRoomId);
        if (data.success && isMounted) {
          setActiveRoomDetail(data.room);
        }
      } catch (err) {
        console.error('Error fetching room detail:', err);
      }
    };
    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [activeRoomId]);

  // Automatically dismiss notifications after 8 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    if (!activeRoomId) return;
    const code = drafts[activeRoomId] || '';
    if (!code.trim()) {
      setSubmitError('Please write or paste your solution before submitting.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await submitRoom(activeRoomId, code);
      if (res.success) {
        // Refresh local submissions and rooms to update the status
        const subsRes = await getMySubmissions();
        if (subsRes.success) setSubmissions(subsRes.submissions);
        const roomsRes = await getRooms();
        if (roomsRes.success) setRooms(roomsRes.rooms);

        setNotification({
          type: 'info',
          message: 'Submission received! Awaiting organizer verification.',
        });
      }
    } catch (err) {
      setSubmitError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (adminSecret) {
    return <AdminPortal onLogout={handleAdminLogout} />;
  }

  if (!team) {
    return <Login onLogin={handleLogin} onAdminLogin={handleAdminLogin} />;
  }

  // Find the latest submission for the active room
  const activeSubmission = activeRoomId
    ? submissions.find((s) => s.rooms?.id === activeRoomId)
    : null;

  // Check if team cleared all seeded rooms
  const hasEscaped = rooms.length > 0 && rooms.every((r) => r.cleared);

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'easy':   return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'hard':   return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'boss':   return 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30';
      default:       return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-50 max-w-sm p-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-slide-in ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
              : notification.type === 'error'
              ? 'bg-rose-950/80 border-rose-500 text-rose-300'
              : 'bg-indigo-950/80 border-indigo-500 text-indigo-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {notification.type === 'success' ? '🏆' : notification.type === 'error' ? '❌' : 'ℹ️'}
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
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-gray-900/30 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-xl">
        <div>
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-500 to-indigo-500 tracking-tight">
            CODE DUNGEON
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs uppercase tracking-widest text-gray-500">Escape Through Logic</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-700"></span>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span
                className={`w-2 h-2 rounded-full ${
                  socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              ></span>
              {socketConnected ? 'Live Connection Active' : 'Offline / Polling Standby'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="block font-mono text-sm text-purple-400 font-bold">Team: {team.teamName}</span>
            <span className="text-xs text-gray-500">
              Cleared: {rooms.filter(r => r.cleared).length} / {rooms.length}
            </span>
          </div>
          <button
            id="logoutBtn"
            onClick={handleLogout}
            className="px-4 py-2.5 bg-gray-900 border border-gray-850 hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Escape / Victory Screen */}
      {hasEscaped && (
        <div className="max-w-7xl mx-auto mb-8 bg-gradient-to-br from-purple-900/40 via-fuchsia-900/30 to-indigo-950/40 border border-purple-500/50 rounded-3xl p-8 md:p-12 text-center shadow-[0_0_50px_rgba(168,85,247,0.2)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.1)_0%,transparent_70%)] animate-pulse"></div>
          <div className="relative z-10">
            <div className="text-6xl mb-6">🏆</div>
            <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-500 to-pink-500 tracking-tight mb-4">
              DUNGEON ESCAPED!
            </h2>
            <p className="text-gray-300 text-lg max-w-xl mx-auto mb-8">
              Incredible job! Team <span className="font-bold text-white">{team.teamName}</span> has completed every challenge, cleared the Boss Chamber, and escaped the dungeon!
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <div className="bg-gray-900/80 px-6 py-4 rounded-2xl border border-gray-800 min-w-36">
                <span className="block text-gray-400 text-xs uppercase tracking-wider">Total Score</span>
                <span className="text-3xl font-black text-purple-400 mt-1 block">
                  {rooms.reduce((acc, r) => acc + (r.cleared ? r.points : 0), 0)} Pts
                </span>
              </div>
              <div className="bg-gray-900/80 px-6 py-4 rounded-2xl border border-gray-800 min-w-36">
                <span className="block text-gray-400 text-xs uppercase tracking-wider">Dungeon Status</span>
                <span className="text-3xl font-black text-emerald-400 mt-1 block">Escaped</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-10 gap-8">
        {/* Left Side: Map & Room Details (Col-span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Dungeon Map Card */}
          <div className="bg-gray-900/20 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              🧭 Dungeon Map
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
              {/* Connector line for desktop */}
              <div className="absolute top-[35%] left-10 right-10 h-0.5 bg-gray-850 -z-10 hidden sm:block"></div>

              {rooms.map((room) => {
                const isCleared = room.cleared;
                const isLocked = room.locked;
                const isActive = room.id === activeRoomId;

                let cardStyles = "border-gray-850 bg-gray-900/30 text-gray-500 cursor-not-allowed";
                if (isCleared) {
                  cardStyles = "border-emerald-500/50 bg-emerald-950/10 text-emerald-400 hover:border-emerald-400 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.05)]";
                } else if (!isLocked) {
                  cardStyles = `border-purple-500/50 bg-purple-950/10 text-purple-300 hover:border-purple-400 cursor-pointer ${
                    isActive ? 'ring-2 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : ''
                  }`;
                }

                return (
                  <button
                    key={room.id}
                    disabled={isLocked}
                    onClick={() => setActiveRoomId(room.id)}
                    className={`relative z-10 p-4 rounded-xl border flex flex-col items-center text-center transition-all duration-300 ${cardStyles}`}
                  >
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-1">
                      Room {room.room_order}
                    </span>
                    <span className="font-bold text-sm block truncate w-full" title={room.title}>
                      {room.title}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">{room.topic}</span>
                    <span className="text-xs font-semibold text-purple-400/80 mt-1">+{room.points} pts</span>

                    <div className="mt-4 flex items-center justify-center">
                      {isCleared ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          ✓ Cleared
                        </span>
                      ) : isLocked ? (
                        <span className="text-xs font-semibold text-gray-600 flex items-center gap-1 bg-gray-950/40 px-2 py-0.5 rounded-full">
                          🔒 Locked
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-purple-400 flex items-center gap-1 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full animate-pulse">
                          ▶ Active
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Room details / Challenge panel */}
          {activeRoomDetail ? (
            <div className="bg-gray-900/20 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-gray-800">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-purple-400 uppercase tracking-widest">
                      Chamber {activeRoomDetail.room_order}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-md ${getDifficultyColor(activeRoomDetail.difficulty)}`}>
                      {activeRoomDetail.difficulty}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black mt-1">{activeRoomDetail.title}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gray-950/80 px-3 py-1.5 rounded-xl border border-gray-800 text-sm">
                    <span className="text-gray-500 font-medium">Topic: </span>
                    <span className="font-semibold text-gray-300">{activeRoomDetail.topic}</span>
                  </div>
                  <div className="bg-purple-950/30 px-3 py-1.5 rounded-xl border border-purple-500/30 text-sm text-purple-400 font-bold">
                    +{activeRoomDetail.points} Points
                  </div>
                </div>
              </div>

              {/* Problem statement */}
              <div className="my-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  📜 Problem Statement
                </h3>
                <div className="bg-gray-950/60 border border-gray-850 rounded-xl p-5 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {activeRoomDetail.problem_statement || (
                    <span className="text-gray-600 font-mono italic">No problem statement seeded.</span>
                  )}
                </div>
              </div>

              {/* Submission Area */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  ⚙️ Chamber Submission
                </h3>

                {/* If cleared */}
                {activeRoomDetail.cleared ? (
                  <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-5 flex flex-col gap-4 text-emerald-300 text-sm">
                    <div className="flex items-center gap-3 font-semibold">
                      <span className="text-xl">✓</span>
                      <span>Chamber cleared! Your submission was accepted by the judge.</span>
                    </div>
                    {activeSubmission && activeSubmission.notes && (
                      <div className="mt-2">
                        <span className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Submitted Code:</span>
                        <pre className="p-4 bg-gray-950 border border-gray-850 rounded-lg text-xs overflow-x-auto text-emerald-400 font-mono max-h-60">
                          {activeSubmission.notes}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : activeSubmission?.status === 'pending' ? (
                  /* If pending */
                  <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-5 flex flex-col gap-4 text-amber-300 text-sm">
                    <div className="flex items-center gap-3 font-semibold animate-pulse">
                      <span className="text-xl">⚡</span>
                      <span>Submission Pending Review. A judge is currently verifying your output.</span>
                    </div>
                    {activeSubmission.notes && (
                      <div className="mt-2">
                        <span className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Submitted Code:</span>
                        <pre className="p-4 bg-gray-950 border border-gray-850 rounded-lg text-xs overflow-x-auto text-amber-500 font-mono max-h-60 opacity-80">
                          {activeSubmission.notes}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  /* If not submitted / rejected */
                  <form onSubmit={handleRoomSubmit} className="space-y-4">
                    {activeSubmission?.status === 'rejected' && (
                      <div className="bg-rose-500/5 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-sm">
                        <div className="font-semibold flex items-center gap-2">
                          <span>❌</span>
                          <span>Submission Rejected</span>
                        </div>
                        <p className="mt-1 text-xs text-rose-400 leading-relaxed">
                          Reason: {activeSubmission.notes || 'Please review your logic and try again.'}
                        </p>
                      </div>
                    )}

                    <div className="relative border border-gray-800 rounded-xl overflow-hidden bg-gray-950 font-mono shadow-inner">
                      <div className="flex justify-between items-center bg-gray-900 px-4 py-2.5 border-b border-gray-800 text-xs text-gray-400">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                          solution.cpp
                        </span>
                        <span className="font-mono text-gray-500">C++ (g++)</span>
                      </div>
                      <textarea
                        value={drafts[activeRoomId] || ''}
                        onChange={(e) => setDrafts({ ...drafts, [activeRoomId]: e.target.value })}
                        placeholder="// Write or paste your C++ solution here...&#10;#include <iostream>&#10;using namespace std;&#10;&#10;int main() {&#10;    // Write your code here&#10;    return 0;&#10;}"
                        className="w-full h-80 p-4 bg-gray-950 text-emerald-400 placeholder-gray-700 outline-none resize-none font-mono text-sm leading-relaxed"
                      />
                    </div>

                    {submitError && (
                      <p className="text-sm text-rose-400 font-medium">{submitError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300 ${
                        submitting
                          ? 'bg-purple-600/50 cursor-not-allowed text-white/50'
                          : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5 active:translate-y-0 text-white cursor-pointer'
                      }`}
                    >
                      {submitting ? 'Submitting Code...' : 'Submit Code for Verification'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-900/20 border border-gray-850 rounded-2xl p-12 text-center text-gray-500 backdrop-blur-xl">
              <span className="text-3xl block mb-2">🧭</span>
              <p>Select an unlocked chamber on the map to begin.</p>
            </div>
          )}

        </div>

        {/* Right Side: Leaderboard Standings (Col-span 3) */}
        <div className="lg:col-span-3">
          <div className="bg-gray-900/20 border border-gray-800/80 rounded-2xl p-5 backdrop-blur-xl sticky top-8 shadow-2xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              Live Standings
            </h3>
            
            <div className="overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                    <th className="py-2.5 px-2">Rank</th>
                    <th className="py-2.5 px-2">Team</th>
                    <th className="py-2.5 px-2 text-center">Rooms</th>
                    <th className="py-2.5 px-2 text-right">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850/50">
                  {leaderboard.map((row) => {
                    const isMe = row.teamName === team.teamName;
                    return (
                      <tr
                        key={row.teamName}
                        className={`text-sm transition-all duration-200 ${
                          isMe
                            ? 'bg-purple-950/20 text-purple-200 font-bold border-l-2 border-purple-500'
                            : 'text-gray-400 hover:bg-gray-900/10'
                        }`}
                      >
                        <td className="py-3 px-2 font-mono text-xs">
                          {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : `#${row.rank}`}
                        </td>
                        <td className="py-3 px-2 truncate max-w-[100px]" title={row.teamName}>
                          {row.teamName}
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-xs">{row.roomsCleared}</td>
                        <td className="py-3 px-2 text-right font-mono text-purple-400 text-xs">
                          {row.totalPoints}
                        </td>
                      </tr>
                    );
                  })}
                  {leaderboard.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-gray-600 font-mono text-xs">
                        No active teams yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

