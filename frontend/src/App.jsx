import { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import AdminPortal from './components/AdminPortal';
import DungeonHall from './components/DungeonHall';
import ChallengePanel from './components/ChallengePanel';
import { disconnectSocket, connectSocket } from './services/socket';
import { getRooms, getRoom, submitRoom, getMySubmissions } from './services/api';
import { getStarterCode } from './questions';

const R='#CC1A00'; const RB='#FF3333'; const G='#F5A623'; const GB='#FFD700';

const getSavedSession   = () => { const t=localStorage.getItem('cd_token'),i=localStorage.getItem('cd_team_id'),n=localStorage.getItem('cd_team_name'); return t&&i&&n?{id:i,teamName:n}:null; };
const getSavedAdmin     = () => localStorage.getItem('cd_admin_secret')||null;

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ notification, onDismiss }) {
  if (!notification) return null;
  const s = {
    success:{ border:'#16a34a', bg:'rgba(2,15,2,0.97)', text:'#4ade80', icon:'🏆' },
    error:  { border:R,         bg:'rgba(15,2,0,0.97)', text:RB,         icon:'💀' },
    info:   { border:G,         bg:'rgba(15,8,0,0.97)', text:GB,         icon:'🔥' },
  }[notification.type] || { border:G, bg:'rgba(10,5,0,0.95)', text:GB, icon:'ℹ️' };
  return (
    <div className="fixed top-6 right-6 z-[100] max-w-sm p-4 rounded-2xl backdrop-blur-xl shadow-2xl animate-slide-in"
      style={{ border:`1px solid ${s.border}`, background:s.bg, boxShadow:`0 0 30px ${s.border}40` }}>
      <div className="flex items-center gap-3">
        <span className="text-2xl animate-skull">{s.icon}</span>
        <p className="text-sm font-medium flex-1" style={{color:s.text}}>{notification.message}</p>
        <button onClick={onDismiss} className="text-gray-600 hover:text-white font-bold text-lg ml-2">×</button>
      </div>
    </div>
  );
}

// ─── Victory Banner ───────────────────────────────────────────────────────────
function VictoryBanner({ team, rooms }) {
  const totalPts = rooms.reduce((a,r)=>a+(r.cleared?r.points:0),0);
  return (
    <div className="w-full mb-8 rounded-3xl p-10 text-center relative overflow-hidden"
      style={{ background:'linear-gradient(135deg,rgba(204,26,0,0.2),rgba(245,166,35,0.15),rgba(255,215,0,0.1))', border:'1px solid rgba(245,166,35,0.5)', boxShadow:'0 0 80px rgba(204,26,0,0.25)' }}>
      <div className="absolute inset-0 animate-pulse" style={{background:'radial-gradient(circle at center,rgba(245,166,35,0.1) 0%,transparent 70%)'}}/>
      <div className="relative z-10">
        <div className="text-8xl mb-6 animate-skull">🏆</div>
        <h2 className="text-5xl font-black tracking-tight mb-4 animate-glitch"
          style={{fontFamily:'Cinzel,serif', background:`linear-gradient(135deg,${RB},${G},${GB})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>
          DUNGEON ESCAPED!
        </h2>
        <p className="text-gray-300 text-lg mb-8">
          Team <span className="font-black text-white">{team.teamName}</span> has conquered every chamber!
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <div className="px-8 py-4 rounded-2xl" style={{background:'rgba(0,0,0,0.5)', border:'1px solid rgba(245,166,35,0.4)'}}>
            <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">Total Score</span>
            <span className="text-4xl font-black" style={{color:GB}}>{totalPts} pts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Scary ambient background ─────────────────────────────────────────────────
function ScaryBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Deep red radial glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full"
        style={{background:'radial-gradient(circle,rgba(150,0,0,0.08) 0%,transparent 65%)'}}/>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full"
        style={{background:'radial-gradient(circle,rgba(120,0,0,0.06) 0%,transparent 65%)'}}/>
      {/* Occasional golden flicker */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
        style={{background:'radial-gradient(circle,rgba(245,166,35,0.03) 0%,transparent 70%)'}}/>
      {/* Lightning flash */}
      <div className="absolute inset-0 bg-red-50 animate-lightning pointer-events-none"/>
      {/* Vignette */}
      <div className="absolute inset-0 animate-vignette pointer-events-none"
        style={{background:'radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.7) 100%)'}}/>
      {/* Stone texture */}
      <div className="absolute inset-0 opacity-[0.02]"
        style={{backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,0.03) 40px,rgba(255,255,255,0.03) 41px),repeating-linear-gradient(90deg,transparent,transparent 60px,rgba(255,255,255,0.02) 60px,rgba(255,255,255,0.02) 61px)'}}/>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ team, rooms, socketConnected, onLogout }) {
  return (
    <header className="w-full flex flex-col md:flex-row justify-between items-center gap-4 mb-8 rounded-2xl p-5 backdrop-blur-xl"
      style={{ background:'rgba(10,2,0,0.8)', border:'1px solid rgba(150,20,0,0.3)', boxShadow:'0 0 40px rgba(100,0,0,0.1)' }}>
      <div>
        <h1 className="text-3xl font-black tracking-tight animate-glitch"
          style={{ fontFamily:'Cinzel,serif', background:`linear-gradient(135deg,${RB} 0%,${G} 60%,${GB} 100%)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', filter:`drop-shadow(0 0 12px rgba(204,26,0,0.5))` }}>
          CODE DUNGEON
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs uppercase tracking-widest font-mono" style={{color:`${G}50`}}>Escape Through Logic</span>
          <span className="text-gray-800">·</span>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className={`w-2 h-2 rounded-full ${socketConnected?'bg-emerald-500 animate-pulse':'bg-red-900'}`}/>
            {socketConnected ? 'Connected' : 'Offline'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <div className="text-right">
          <span className="block font-mono text-sm font-bold" style={{color:G}}>⚔️ {team.teamName}</span>
          <span className="text-xs text-gray-600 font-mono">{rooms.filter(r=>r.cleared).length}/{rooms.length} escaped</span>
        </div>
        <button onClick={onLogout}
          className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-white transition-all duration-200"
          style={{border:'1px solid rgba(150,20,0,0.3)', background:'rgba(150,20,0,0.05)'}}>
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

  const handleLogin       = (t) => setTeam(t);
  const handleAdminLogin  = (s) => setAdminSecret(s);
  const handleAdminLogout = () => { localStorage.removeItem('cd_admin_secret'); setAdminSecret(null); };

  const handleLogout = () => {
    ['cd_token','cd_team_id','cd_team_name'].forEach(k=>localStorage.removeItem(k));
    disconnectSocket();
    setTeam(null); setRooms([]); setActiveRoomId(null); setActiveRoomDetail(null);
    setSubmissions([]); setChallengeOpen(false);
  };

  const refreshData = useCallback(async () => {
    try {
      const [rRes, sRes] = await Promise.all([getRooms(), getMySubmissions()]);
      if (rRes.success) {
        setRooms(rRes.rooms);
        if (!activeRoomId) {
          const def = rRes.rooms.find(r=>!r.locked&&!r.cleared) || rRes.rooms[0];
          if (def) setActiveRoomId(def.id);
        }
      }
      if (sRes.success) setSubmissions(sRes.submissions);
    } catch (e) { console.error(e); }
  }, [activeRoomId]);

  useEffect(() => {
    if (!team) return;
    const socket = connectSocket(team.id);
    if (socket) {
      setSocketConnected(socket.connected);
      socket.on('connect',    () => setSocketConnected(true));
      socket.on('disconnect', () => setSocketConnected(false));
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
      if (socket) { socket.off('connect'); socket.off('disconnect'); socket.off('room:unlocked'); socket.off('submission:rejected'); }
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
    <div className="min-h-screen text-white relative" style={{background:'linear-gradient(160deg,#0D0300 0%,#180500 40%,#0D0300 100%)'}}>
      <ScaryBackground />
      <div className="relative z-10 max-w-5xl mx-auto p-4 md:p-8">
        <Toast notification={notification} onDismiss={()=>setNotification(null)} />
        <Header team={team} rooms={rooms} socketConnected={socketConnected} onLogout={handleLogout} />
        {hasEscaped && <VictoryBanner team={team} rooms={rooms} />}

        {/* NOTE: Leaderboard intentionally hidden from participant view */}
        <DungeonHall rooms={rooms} activeRoomId={activeRoomId} onSelectRoom={handleSelectRoom} />
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
