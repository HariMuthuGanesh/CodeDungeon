import { useState } from 'react';
import { login as apiLogin } from '../services/api';
import { connectSocket } from '../services/socket';

export default function Login({ onLogin }) {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Call backend — throws on non-OK status
      const data = await apiLogin(teamName, password);

      // Persist JWT so every subsequent API call has it
      localStorage.setItem('cd_token',   data.token);
      localStorage.setItem('cd_team_id', data.team.id);
      localStorage.setItem('cd_team_name', data.team.teamName);

      // Connect socket and join the team's private room
      connectSocket(data.team.id);

      // Lift full team object up to App
      onLogin(data.team);

    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl p-8 transform transition-all duration-500 hover:scale-[1.01]">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-fuchsia-500 tracking-tight">
            CODE DUNGEON
          </h1>
          <p className="text-gray-400 mt-2 text-sm font-medium uppercase tracking-widest">
            Escape Through Logic
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Team Name</label>
            <input
              type="text"
              id="teamName"
              required
              autoComplete="username"
              className="w-full px-4 py-3 rounded-lg bg-gray-950/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Enter your team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Access Code</label>
            <input
              type="password"
              id="password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-lg bg-gray-950/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Enter dungeon access code"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            id="loginBtn"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg text-white font-bold text-sm uppercase tracking-wider transition-all duration-300
              ${isLoading
                ? 'bg-purple-600/50 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/50 hover:-translate-y-1'
              }
            `}
          >
            {isLoading ? 'Entering Dungeon...' : 'Enter Dungeon'}
          </button>
        </form>
      </div>
    </div>
  );
}
