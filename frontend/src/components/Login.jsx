import { useState } from 'react';
import { login as apiLogin, register as apiRegister, adminGetSubmissions } from '../services/api';
import { connectSocket } from '../services/socket';

// ─── Theme tokens ────────────────────────────────────────────────────────────
const T = {
  primary:  '#CC1A00',   // Crimson red
  gold:     '#F5A623',   // Golden amber
  goldBright: '#FFD700', // Pure gold
  redBright: '#FF3333',  // Bright red
  bg:       '#0D0500',   // Deep dark red-black
  border:   'rgba(204,26,0,0.3)',
  glow:     'rgba(204,26,0,0.4)',
  goldGlow: 'rgba(245,166,35,0.4)',
};

const inputCls = 'w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all';
const inputStyle = {
  background: 'rgba(0,0,0,0.5)',
  border: `1px solid rgba(204,26,0,0.25)`,
  color: '#fff',
};
const inputFocusStyle = {
  borderColor: T.gold,
  boxShadow: `0 0 0 2px ${T.goldGlow}`,
};

function InputField({ label, type = 'text', value, onChange, placeholder, required }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-2 font-mono" style={{ color: T.gold + 'aa' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={inputCls}
        style={{ ...inputStyle, ...(focused ? inputFocusStyle : {}) }}
      />
    </div>
  );
}

export default function Login({ onLogin, onAdminLogin }) {
  const [mode, setMode]             = useState('login');   // 'login' | 'register' | 'admin'
  const [teamName, setTeamName]     = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [members, setMembers]       = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [error, setError]           = useState('');
  const [isLoading, setIsLoading]   = useState(false);

  const resetForm = (newMode) => {
    setMode(newMode);
    setError('');
    setTeamName('');
    setPassword('');
    setConfirmPw('');
    setMembers('');
    setAdminSecret('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'admin') {
        if (!adminSecret.trim()) throw new Error('Admin secret code is required.');
        localStorage.setItem('cd_admin_secret', adminSecret);
        await adminGetSubmissions();
        onAdminLogin(adminSecret);

      } else if (mode === 'register') {
        if (password !== confirmPw) throw new Error('Passwords do not match.');
        if (password.length < 4) throw new Error('Password must be at least 4 characters.');
        const membersArr = members ? members.split(',').map(m => m.trim()).filter(Boolean) : [];
        const data = await apiRegister(teamName.trim(), password, membersArr);
        localStorage.setItem('cd_token', data.token);
        localStorage.setItem('cd_team_id', data.team.id);
        localStorage.setItem('cd_team_name', data.team.teamName);
        connectSocket(data.team.id);
        onLogin(data.team);

      } else {
        const data = await apiLogin(teamName, password);
        localStorage.setItem('cd_token', data.token);
        localStorage.setItem('cd_team_id', data.team.id);
        localStorage.setItem('cd_team_name', data.team.teamName);
        connectSocket(data.team.id);
        onLogin(data.team);
      }
    } catch (err) {
      localStorage.removeItem('cd_admin_secret');
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0D0500 0%, #1a0800 50%, #0D0500 100%)' }}
    >
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[15%] w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(204,26,0,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[15%] right-[15%] w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.10) 0%, transparent 70%)' }} />
      </div>

      <div
        className="relative z-10 w-full max-w-4xl rounded-3xl shadow-2xl p-6 md:p-8 backdrop-blur-2xl"
        style={{
          background: 'rgba(13,5,0,0.85)',
          border: `1px solid rgba(204,26,0,0.25)`,
          boxShadow: '0 0 60px rgba(204,26,0,0.1), 0 0 120px rgba(245,166,35,0.05)',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

          {/* Left: Branding */}
          <div className="space-y-6 text-center md:text-left">
            <div>
              <h1
                className="text-4xl md:text-5xl font-black tracking-tight"
                style={{
                  fontFamily: 'Cinzel, serif',
                  background: `linear-gradient(135deg, ${T.redBright} 0%, ${T.gold} 60%, ${T.goldBright} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 20px rgba(245,166,35,0.3))',
                }}
              >
                CODE DUNGEON
              </h1>
              <p className="text-xs font-semibold uppercase tracking-widest mt-2" style={{ color: T.gold + '80' }}>
                Escape Through Logic
              </p>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed max-w-md">
              A gamified competitive programming arena. Solve logic puzzles, unlock chambers in real-time, and escape the dungeon.
            </p>
          </div>

          {/* Right: Form */}
          <div
            className="rounded-2xl p-6 md:p-7 backdrop-blur-xl"
            style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid rgba(204,26,0,0.2)` }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Mode switcher tabs */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.4)' }}>
                {[
                  { key: 'login', label: '🔑 Login' },
                  { key: 'register', label: '✨ Sign Up' },
                  { key: 'admin', label: '🛡️ Organizer' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => resetForm(key)}
                    className="flex-1 py-2 rounded-lg text-xs font-bold tracking-wide transition-all duration-200"
                    style={mode === key ? {
                      background: key === 'admin' ? T.primary : `linear-gradient(135deg, ${T.primary}, ${T.gold})`,
                      color: '#fff',
                      boxShadow: `0 0 12px ${T.glow}`,
                    } : { color: '#6b7280' }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {error && (
                <div className="p-3 rounded-xl text-xs text-center font-medium" style={{ background: 'rgba(204,26,0,0.1)', border: `1px solid rgba(204,26,0,0.3)`, color: '#FF3333' }}>
                  {error}
                </div>
              )}

              {mode === 'admin' ? (
                <InputField label="Organizer Secret Code" type="password" value={adminSecret} onChange={e => setAdminSecret(e.target.value)} placeholder="Enter organizer secret key" required />
              ) : (
                <>
                  <InputField label="Team Name" value={teamName} onChange={e => setTeamName(e.target.value)} placeholder={mode === 'register' ? 'Choose a unique team name' : 'Enter your team name'} required />
                  <InputField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'register' ? 'Create a password (min 4 chars)' : 'Enter your password'} required />
                  {mode === 'register' && (
                    <>
                      <InputField label="Confirm Password" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Re-enter your password" required />
                      <InputField label="Members (optional, comma-separated)" value={members} onChange={e => setMembers(e.target.value)} placeholder="Alice, Bob, Charlie" />
                    </>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest overflow-hidden group"
                style={{
                  background: isLoading ? 'rgba(204,26,0,0.3)' : `linear-gradient(135deg, ${T.primary} 0%, ${T.gold} 100%)`,
                  color: '#fff',
                  boxShadow: isLoading ? 'none' : `0 0 24px ${T.glow}`,
                }}
              >
                <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entering...
                  </span>
                ) : mode === 'admin' ? '🛡️ Enter Dashboard'
                  : mode === 'register' ? '🔥 Create Team & Enter'
                  : '🚪 Enter Dungeon'}
              </button>

              {mode === 'login' && (
                <p className="text-center text-xs text-gray-600">
                  New team?{' '}
                  <button type="button" onClick={() => resetForm('register')} className="font-bold" style={{ color: T.gold }}>
                    Register here
                  </button>
                </p>
              )}
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
