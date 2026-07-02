import { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import AdminPortal from './components/AdminPortal';
import DungeonHall from './components/DungeonHall';
import ChallengePanel from './components/ChallengePanel';
import Leaderboard from './components/Leaderboard';
import { disconnectSocket, connectSocket } from './services/socket';
import { getRooms, getRoom, submitRoom, getMySubmissions, getLeaderboard } from './services/api';
import { getStarterCode } from './questions';

const getSavedSession   = () => { const t=localStorage.getItem('cd_token'),i=localStorage.getItem('cd_team_id'),n=localStorage.getItem('cd_team_name'); return t&&i&&n?{id:i,teamName:n}:null; };
const getSavedAdmin     = () => localStorage.getItem('cd_admin_secret')||null;

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ notification, onDismiss }) {
  if (!notification) return null;
  const s = {
    success:{ border:'var(--color-success)', bg:'var(--color-stone-secondary)', text:'var(--color-success)', icon:'🛡️' },
    error:  { border:'var(--color-error)', bg:'var(--color-stone-primary)', text:'var(--color-error)', icon:'⚔️' },
    info:   { border:'var(--color-gold)', bg:'var(--color-stone-primary)', text:'var(--color-gold)', icon:'🔥' },
  }[notification.type] || { border:'var(--color-bronze)', bg:'var(--color-stone-primary)', text:'var(--color-bronze)', icon:'📜' };
  return (
    <div className="fixed top-6 right-6 z-[100] max-w-sm p-4 rounded iron-border animate-slide-in"
      style={{ background:s.bg }}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{s.icon}</span>
        <p className="text-sm font-medium flex-1" style={{color:s.text}}>{notification.message}</p>
        <button onClick={onDismiss} className="text-gray-500 hover:text-white font-bold text-lg ml-2">×</button>
      </div>
    </div>
  );
}

// ─── Victory Banner ───────────────────────────────────────────────────────────
function VictoryBanner({ team, rooms }) {
  const totalPts = rooms.reduce((a,r)=>a+(r.cleared?r.points:0),0);
  return (
    <div className="w-full mb-8 rounded iron-border bg-stone-texture p-10 text-center relative overflow-hidden"
      style={{ boxShadow:'0 0 40px rgba(212,175,55,0.1)' }}>
      <div className="absolute inset-0 animate-pulse-amber opacity-30"/>
      <div className="relative z-10">
        <div className="text-8xl mb-6">🏆</div>
        <h2 className="text-5xl font-black tracking-tight mb-4"
          style={{fontFamily:'var(--font-cinzel)', background:`linear-gradient(135deg,var(--color-gold),#FFF)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', textShadow:'0 2px 4px rgba(0,0,0,0.8)'}}>
          DUNGEON ESCAPED!
        </h2>
        <p className="text-gray-300 text-lg mb-8">
          Team <span className="font-black text-white">{team.teamName}</span> has conquered every chamber!
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <div className="px-8 py-4 rounded iron-border bg-stone-texture">
            <span className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Total Score</span>
            <span className="text-4xl font-black" style={{color:'var(--color-gold)'}}>{totalPts} pts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Medieval ambient background ────────────────────────────────────────────────
function MedievalBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Torches */}
      <div className="absolute top-1/3 left-0 w-32 h-64 opacity-60">
        <div className="absolute top-10 left-10 w-4 h-16 bg-gray-900 rounded" />
        <div className="absolute top-4 left-6 w-12 h-12 bg-orange-500 rounded-full blur-xl animate-torch" />
      </div>
      <div className="absolute top-1/3 right-0 w-32 h-64 opacity-60">
        <div className="absolute top-10 right-10 w-4 h-16 bg-gray-900 rounded" />
        <div className="absolute top-4 right-6 w-12 h-12 bg-orange-500 rounded-full blur-xl animate-torch" />
      </div>
      
      {/* Fog */}
      <div className="absolute bottom-[-10%] left-[-20%] w-[140%] h-[40%] animate-fog"
        style={{background:'radial-gradient(ellipse, rgba(200,200,200,0.05) 0%, transparent 60%)'}}/>
      
      {/* Dust */}
      <div className="absolute inset-0 bg-white animate-dust"
        style={{clipPath:'circle(1px at center)', filter:'blur(1px)'}} />
      <div className="absolute inset-0 bg-white animate-dust"
        style={{clipPath:'circle(1.5px at 20% 30%)', animationDelay: '5s'}} />
      <div className="absolute inset-0 bg-white animate-dust"
        style={{clipPath:'circle(1px at 80% 60%)', animationDelay: '10s'}} />
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ team, rooms, socketConnected, onLogout }) {
  return (
    <header className="w-full flex flex-col md:flex-row justify-between items-center gap-4 mb-8 p-5 bg-stone-texture iron-border">
      <div>
        <h1 className="text-3xl font-black tracking-tight"
          style={{ fontFamily:'var(--font-cinzel)', background:`linear-gradient(135deg,var(--color-gold) 0%,#FFF 100%)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', textShadow:'0 2px 4px rgba(0,0,0,0.8)' }}>
          CODE DUNGEON
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs uppercase tracking-widest font-mono" style={{color:'var(--color-bronze)'}}>Escape Through Logic</span>
          <span className="text-gray-600">·</span>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`w-2 h-2 rounded-full ${socketConnected?'bg-emerald-600':'bg-red-800'}`}/>
            {socketConnected ? 'Connected' : 'Offline'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <div className="text-right">
          <span className="block font-mono text-sm font-bold text-gray-200">⚔️ {team.teamName}</span>
          <span className="text-xs text-gray-500 font-mono">{rooms.filter(r=>r.cleared).length}/{rooms.length} escaped</span>
        </div>
        <button onClick={onLogout}
          className="stone-btn px-4 py-2 text-xs">
          Logout
        </button>
      </div>
    </header>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [team, setTeam]                         = useState(getSavedSession);
  const [adminSecret, setAdminSecret]           = useState(getSavedAdmin);
  const [rooms, setRooms]                       = useState([]);
  const [activeRoomId, setActiveRoomId]         = useState(null);
  const [activeRoomDetail, setActiveRoomDetail] = useState(null);
  const [submissions, setSubmissions]           = useState([]);
  const [drafts, setDrafts]                     = useState({});
  const [submitting, setSubmitting]             = useState(false);
  const [submitError, setSubmitError]           = useState(null);
  const [notification, setNotification]         = useState(null);
  const [socketConnected, setSocketConnected]   = useState(false);
  const [challengeOpen, setChallengeOpen]       = useState(false);
  const [leaderboard, setLeaderboard]           = useState([]);

  const handleLogin       = (t) => setTeam(t);
  const handleAdminLogin  = (s) => setAdminSecret(s);
  const handleAdminLogout = () => { localStorage.removeItem('cd_admin_secret'); setAdminSecret(null); };

  const handleLogout = () => {
    ['cd_token','cd_team_id','cd_team_name'].forEach(k=>localStorage.removeItem(k));
    disconnectSocket();
    setTeam(null); setRooms([]); setActiveRoomId(null); setActiveRoomDetail(null);
    setSubmissions([]); setChallengeOpen(false); setLeaderboard([]);
  };

  const refreshData = useCallback(async () => {
    try {
      const [rRes, sRes, lRes] = await Promise.all([getRooms(), getMySubmissions(), getLeaderboard()]);
      if (rRes.success) {
        setRooms(rRes.rooms);
        if (!activeRoomId) {
          const def = rRes.rooms.find(r=>!r.locked&&!r.cleared) || rRes.rooms[0];
          if (def) setActiveRoomId(def.id);
        }
      }
      if (sRes.success) setSubmissions(sRes.submissions);
      if (lRes.success) setLeaderboard(lRes.leaderboard || []);
    } catch (e) { console.error(e); }
  }, [activeRoomId]);

  useEffect(() => {
    if (!team) return;
    const socket = connectSocket(team.id);
    if (socket) {
      setSocketConnected(socket.connected);
      socket.on('connect',    () => setSocketConnected(true));
      socket.on('disconnect', () => setSocketConnected(false));
      socket.on('leaderboard:update', (data) => setLeaderboard(data || []));
      socket.on('room:unlocked', p => {
        setNotification({ type:'success', message:`🏆 "${p.roomTitle}" cleared! +${p.points} pts!` });
        refreshData();
      });
      socket.on('submission:rejected', p => {
        setNotification({ type:'error', message:`💀 "${p.roomTitle}" rejected: ${p.message}` });
        refreshData();
      });
    }
    refreshData();
    const iv = setInterval(refreshData, 30000);
    return () => {
      if (socket) { socket.off('connect'); socket.off('disconnect'); socket.off('room:unlocked'); socket.off('submission:rejected'); socket.off('leaderboard:update'); }
      clearInterval(iv);
    };
  }, [team, refreshData]);

  useEffect(() => {
    if (!activeRoomId) { setActiveRoomDetail(null); return; }
    let alive=true;
    getRoom(activeRoomId).then(d=>{ if(d.success&&alive) setActiveRoomDetail(d.room); }).catch(()=>{});
    return () => { alive=false; };
  }, [activeRoomId]);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(()=>setNotification(null), 8000);
    return () => clearTimeout(t);
  }, [notification]);

  const handleSelectRoom = (id) => { setActiveRoomId(id); setSubmitError(null); setChallengeOpen(true); };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    if (!activeRoomId) return;
    const code = drafts[activeRoomId] || '';
    if (!code.trim()) { setSubmitError('Write your solution before submitting.'); return; }
    setSubmitting(true); setSubmitError(null);
    try {
      const res = await submitRoom(activeRoomId, code);
      if (res.success) {
        const s = await getMySubmissions(); if (s.success) setSubmissions(s.submissions);
        const r = await getRooms(); if (r.success) setRooms(r.rooms);
        setNotification({ type:'info', message:'🔥 Submission received! Awaiting judge...' });
      }
    } catch (err) { setSubmitError(err.message||'Submission failed.'); }
    finally { setSubmitting(false); }
  };

  if (adminSecret) return <AdminPortal onLogout={handleAdminLogout} />;
  if (!team)       return <Login onLogin={handleLogin} onAdminLogin={handleAdminLogin} />;

  const hasEscaped = rooms.length>0 && rooms.every(r=>r.cleared);
  const activeSub  = activeRoomId ? submissions.find(s=>s.rooms?.id===activeRoomId) : null;
  const activeCode = drafts[activeRoomId]!==undefined ? drafts[activeRoomId] : (activeRoomDetail?.room_order ? getStarterCode(activeRoomDetail.room_order) : '');

  return (
    <div className="min-h-screen text-gray-200 relative bg-stone-texture">
      <MedievalBackground />
      <div className="relative z-10 max-w-5xl mx-auto p-4 md:p-8">
        <Toast notification={notification} onDismiss={()=>setNotification(null)} />
        <Header team={team} rooms={rooms} socketConnected={socketConnected} onLogout={handleLogout} />
        {hasEscaped && <VictoryBanner team={team} rooms={rooms} />}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <DungeonHall rooms={rooms} activeRoomId={activeRoomId} onSelectRoom={handleSelectRoom} />
          </div>
          <div className="w-full lg:w-80 shrink-0">
            <Leaderboard leaderboard={leaderboard} currentTeamName={team.teamName} />
          </div>
        </div>
      </div>

      {challengeOpen && activeRoomDetail && (
        <ChallengePanel
          room={activeRoomDetail}
          code={activeCode}
          onCodeChange={val => setDrafts(p=>({...p,[activeRoomId]:val}))}
          onSubmit={handleRoomSubmit}
          submitting={submitting}
          submitError={submitError}
          submission={activeSub}
          onClose={() => { setChallengeOpen(false); setSubmitError(null); }}
        />
      )}
    </div>
  );
}

export default App;
