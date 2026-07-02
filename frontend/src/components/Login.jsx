import { useState } from 'react';
import { login as apiLogin, register as apiRegister, adminGetSubmissions } from '../services/api';
import { connectSocket } from '../services/socket';

// ─── Theme tokens ────────────────────────────────────────────────────────────
// Using CSS variables defined in index.css

const inputCls = 'w-full px-4 py-3 rounded text-gray-200 text-sm outline-none transition-all font-inter bg-stone-texture iron-border';
const inputStyle = {
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)'
};
const inputFocusStyle = {
  borderColor: 'var(--color-gold)',
  boxShadow: `inset 0 2px 4px rgba(0,0,0,0.6), 0 0 8px rgba(212,175,55,0.4)`,
};

function InputField({ label, type = 'text', value, onChange, placeholder, required }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-2 font-cinzel text-gray-400">
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
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-stone-texture"
    >
      <div
        className="relative z-10 w-full max-w-4xl rounded p-6 md:p-8 bg-stone-texture iron-border"
        style={{
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 100px rgba(0,0,0,0.9)',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

          {/* Left: Branding */}
          <div className="space-y-6 text-center md:text-left relative">
            <div>
              <h1
                className="text-4xl md:text-5xl font-black tracking-tight"
                style={{
                  fontFamily: 'var(--font-cinzel)',
                  background: `linear-gradient(135deg, var(--color-gold) 0%, #FFF 60%, var(--color-bronze) 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))',
                }}
              >
                CODE DUNGEON
              </h1>
              <p className="text-xs font-semibold uppercase tracking-widest mt-2 text-gray-500 font-cinzel">
                Escape Through Logic
              </p>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed max-w-md">
              A gamified competitive programming arena. Solve logic puzzles, unlock chambers in real-time, and escape the dungeon.
            </p>
          </div>

          {/* Right: Form */}
          <div
            className="rounded p-6 md:p-7 bg-stone-texture iron-border"
            style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Mode switcher tabs */}
              <div className="flex gap-1 p-1 rounded iron-border bg-stone-texture">
                {[
                  { key: 'login', label: '🔑 Login' },
                  { key: 'register', label: '✨ Sign Up' },
                  { key: 'admin', label: '🛡️ Organizer' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => resetForm(key)}
                    className="flex-1 py-2 rounded text-xs font-bold tracking-wide transition-all duration-200 font-cinzel uppercase"
                    style={mode === key ? {
                      background: 'var(--color-stone-primary)',
                      color: 'var(--color-gold)',
                      borderBottom: '2px solid var(--color-gold)',
                      boxShadow: 'inset 0 -2px 10px rgba(212,175,55,0.1)'
                    } : { color: '#6b7280', borderBottom: '2px solid transparent' }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {error && (
                <div className="p-3 rounded text-xs text-center font-medium font-inter iron-border bg-stone-texture" style={{ color: 'var(--color-error)' }}>
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
                className="stone-btn w-full py-3.5"
              >
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
                  <button type="button" onClick={() => resetForm('register')} className="font-bold text-gray-300 hover:text-white underline">
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
