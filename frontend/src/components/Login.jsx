import { useState, useEffect } from 'react';
import { login as apiLogin, getLeaderboard, adminGetSubmissions } from '../services/api';
import { connectSocket } from '../services/socket';

export default function Login({ onLogin, onAdminLogin }) {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  
  // Modes
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showStandings, setShowStandings] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Leaderboard data for guest view
  const [leaderboard, setLeaderboard] = useState([]);

  // Fetch leaderboard if guest standings is toggled on
  useEffect(() => {
    if (!showStandings) return;

    const fetchGuestLeaderboard = async () => {
      try {
        const res = await getLeaderboard();
        if (res.success) setLeaderboard(res.leaderboard);
      } catch (err) {
        console.error('Failed to load guest leaderboard:', err);
      }
    };

    fetchGuestLeaderboard();

    // Bind socket if already connected or connect one
    const socket = connectSocket('guest');
    if (socket) {
      socket.on('leaderboard:update', (updatedLeaderboard) => {
        setLeaderboard(updatedLeaderboard);
      });
    }

    const interval = setInterval(fetchGuestLeaderboard, 15000);

    return () => {
      if (socket) {
        socket.off('leaderboard:update');
      }
      clearInterval(interval);
    };
  }, [showStandings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isAdminMode) {
        if (!adminSecret.trim()) {
          throw new Error('Admin secret code is required.');
        }
        
        // Verify key by checking if we can query submissions
        localStorage.setItem('cd_admin_secret', adminSecret);
        await adminGetSubmissions(); // Throws 403 on invalid key
        
        // Trigger admin login
        onAdminLogin(adminSecret);
      } else {
        const data = await apiLogin(teamName, password);

        // Persist JWT
        localStorage.setItem('cd_token', data.token);
        localStorage.setItem('cd_team_id', data.team.id);
        localStorage.setItem('cd_team_name', data.team.teamName);

        // Connect socket
        connectSocket(data.team.id);

        // Notify App
        onLogin(data.team);
      }
    } catch (err) {
      localStorage.removeItem('cd_admin_secret');
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse animation-delay-2000"></div>

      {/* Main Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-4xl bg-gray-900/30 backdrop-blur-2xl border border-gray-800 rounded-3xl shadow-2xl p-6 md:p-8 transition-all duration-300">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* Left Side: Branding / Standings toggle */}
          <div className="space-y-6 text-center md:text-left">
            <div>
              <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-500 to-indigo-500 tracking-tight">
                CODE DUNGEON
              </h1>
              <p className="text-gray-400 mt-2 text-xs font-semibold uppercase tracking-widest">
                Escape Through Logic
              </p>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed max-w-md">
              A gamified competitive programming arena. Solve logic puzzles, unlock chambers in real-time, and climb the standings to escape.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowStandings(!showStandings);
                  setError('');
                }}
                className={`px-5 py-2.5 rounded-xl border text-sm font-bold tracking-wider uppercase transition-all duration-300 w-full sm:w-auto cursor-pointer ${
                  showStandings
                    ? 'bg-purple-900/30 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : 'bg-gray-900/40 border-gray-800 text-gray-300 hover:border-gray-700 hover:text-white'
                }`}
              >
                {showStandings ? '← Back to Login' : '🏆 View Live Standings'}
              </button>
            </div>
          </div>

          {/* Right Side: Dynamic Form OR Leaderboard */}
          <div className="bg-gray-950/40 border border-gray-850/80 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
            {showStandings ? (
              /* Guest Leaderboard View */
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  Live Standings
                </h3>
                <div className="max-h-[360px] overflow-y-auto pr-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800 text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                        <th className="py-2 px-1">Rank</th>
                        <th className="py-2 px-1">Team</th>
                        <th className="py-2 px-1 text-center">Rooms</th>
                        <th className="py-2 px-1 text-right">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850/40">
                      {leaderboard.map((row) => (
                        <tr key={row.teamName} className="text-xs text-gray-300 hover:bg-gray-900/10">
                          <td className="py-2.5 px-1 font-mono">
                            {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : `#${row.rank}`}
                          </td>
                          <td className="py-2.5 px-1 font-bold text-white truncate max-w-[100px]">{row.teamName}</td>
                          <td className="py-2.5 px-1 text-center font-mono">{row.roomsCleared}</td>
                          <td className="py-2.5 px-1 text-right font-mono text-purple-400 font-bold">
                            {row.totalPoints}
                          </td>
                        </tr>
                      ))}
                      {leaderboard.length === 0 && (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-gray-600 font-mono">
                            No registered teams yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Authentication Forms */
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">
                    {isAdminMode ? 'Organizer Login' : 'Team Entrance'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdminMode(!isAdminMode);
                      setError('');
                      setTeamName('');
                      setPassword('');
                      setAdminSecret('');
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
                  >
                    {isAdminMode ? 'Contestant portal' : 'Organizer portal'}
                  </button>
                </div>

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs text-center font-medium">
                    {error}
                  </div>
                )}

                {isAdminMode ? (
                  /* Admin Secret Input */
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 font-mono">
                      Organizer Secret Code
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter organizer secret key"
                      value={adminSecret}
                      onChange={(e) => setAdminSecret(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-gray-950/60 border border-gray-800 text-white placeholder-gray-650 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                ) : (
                  /* Team Credentials */
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 font-mono">
                        Team Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter registered team name"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-gray-950/60 border border-gray-800 text-white placeholder-gray-650 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 font-mono">
                        Dungeon Access Code
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Enter team access password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-gray-950/60 border border-gray-800 text-white placeholder-gray-650 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    isLoading
                      ? 'bg-purple-600/50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35 hover:-translate-y-0.5 active:translate-y-0'
                  }`}
                >
                  {isLoading
                    ? 'Entering Arena...'
                    : isAdminMode
                    ? 'Enter Dashboard'
                    : 'Enter Dungeon'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

