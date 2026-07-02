import { useState, useEffect, useCallback } from 'react';
import {
  adminGetRooms, adminCreateRoom, adminUpdateRoom,
  adminGetSubmissions, adminAcceptSubmission, adminRejectSubmission,
  adminGetTeams, adminCreateTeam, getLeaderboard,
} from '../services/api';
import { connectSocket } from '../services/socket';

const panel = { background:'var(--color-stone-secondary)', border:`3px solid var(--color-iron)`, boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.5)', borderRadius: '4px' };
const card  = { background:'var(--color-stone-primary)', border:`1px solid var(--color-iron)`, borderRadius: '4px' };
const inp   = 'w-full px-3 py-2.5 rounded text-sm text-gray-200 placeholder-gray-500 outline-none focus:ring-2 transition-all font-inter';
const inpSt = { background:'var(--color-stone-secondary)', border:'1px solid var(--color-iron)' };
const btnPrimary = { background:`linear-gradient(180deg, var(--color-stone-primary) 0%, var(--color-stone-secondary) 100%)`, border: '2px solid var(--color-gold)', color:'#F5F5F5', boxShadow:`0 4px 6px rgba(0,0,0,0.6)` };
const tabActive  = { color:'var(--color-gold)', borderBottom:`2px solid var(--color-gold)` };
const tabInactive= { color:'#6b7280' };

const R='#CC1A00'; const RB='#FF3333'; const G='#D4AF37'; const GB='#FFD700';

// ─── Per-team progress helper ─────────────────────────────────────────────────
function TeamMonitorRow({ team, submissions, rooms }) {
  const teamSubs   = submissions.filter(s => s.teams?.id === team.id || s.teams?.team_name === team.team_name);
  const accepted   = teamSubs.filter(s => s.status === 'accepted');
  const pending    = teamSubs.filter(s => s.status === 'pending');
  const cleared    = accepted.length;
  const total      = rooms.length || 1;
  const pct        = Math.round((cleared/total)*100);
  const latestRoom = accepted.length
    ? Math.max(...accepted.map(s => s.rooms?.room_order||0))
    : 0;

  return (
    <div className="rounded-xl p-4" style={card}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <span className="font-bold text-white text-sm">{team.team_name}</span>
          {team.members?.length>0 && (
            <span className="text-[10px] text-gray-600 block font-mono">{team.members.join(', ')}</span>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="block text-lg font-black font-mono" style={{color:GB}}>{cleared}<span className="text-xs text-gray-600">/{rooms.length}</span></span>
          <span className="text-[10px] text-gray-600 font-mono">rooms done</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full mb-3" style={{background:'var(--color-stone-secondary)', border:'1px solid var(--color-iron)'}}>
        <div className="h-1.5 rounded-full transition-all duration-500"
          style={{width:`${pct}%`, background:`linear-gradient(90deg, var(--color-bronze), var(--color-gold))`, boxShadow:`0 0 8px var(--color-gold)`}} />
      </div>

      <div className="flex flex-wrap gap-2">
        {latestRoom>0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono"
            style={{background:'rgba(245,166,35,0.1)', border:`1px solid ${G}40`, color:G}}>
            🔓 Floor {latestRoom}
          </span>
        )}
        {pending.length>0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono animate-pulse"
            style={{background:'rgba(255,215,0,0.1)', border:`1px solid ${GB}40`, color:GB}}>
            ⏳ {pending.length} pending
          </span>
        )}
        {cleared===rooms.length && rooms.length>0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono"
            style={{background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', color:'#4ade80'}}>
            🏆 ESCAPED!
          </span>
        )}
      </div>
    </div>
  );
}

export default function AdminPortal({ onLogout }) {
  const [activeTab, setActiveTab] = useState('submissions');
  const [rooms,       setRooms]       = useState([]);
  const [teams,       setTeams]       = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoom, setNewRoom]     = useState({ room_order:'', title:'', topic:'', difficulty:'easy', points:'', problem_statement:'' });
  const [newTeam, setNewTeam]     = useState({ teamName:'', password:'', members:'' });
  const [teamError, setTeamError] = useState('');
  const [teamSuccess, setTeamSuccess] = useState('');
  const [notification, setNotification] = useState(null);

  const showToast = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [rRes, sRes, tRes, lRes] = await Promise.all([
        adminGetRooms(), adminGetSubmissions(), adminGetTeams(), getLeaderboard(),
      ]);
      if (rRes.success) setRooms(rRes.rooms);
      if (sRes.success) {
        setSubmissions(sRes.submissions);
        if (selectedSub) {
          const upd = sRes.submissions.find(s=>s.id===selectedSub.id);
          setSelectedSub(upd||null);
        }
      }
      if (tRes.success) setTeams(tRes.teams);
      if (lRes.success) setLeaderboard(lRes.leaderboard);
    } catch(e){ console.error(e); }
  }, [selectedSub]);

  useEffect(() => {
    fetchAll();
    const socket = connectSocket('admin');
    if (socket) {
      socket.on('leaderboard:update', setLeaderboard);
      socket.on('submission:new', fetchAll);
    }
    const iv = setInterval(fetchAll, 15000);
    return () => {
      if (socket) { socket.off('leaderboard:update'); socket.off('submission:new'); }
      clearInterval(iv);
    };
  }, [fetchAll]);

  const handleAccept = async (subId) => {
    setActionLoading(true);
    try {
      const res = await adminAcceptSubmission(subId);
      if (res.success) { showToast('success','✅ Accepted! Next room unlocked.'); await fetchAll(); }
    } catch(e){ showToast('error', e.message||'Failed.'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async (e, subId) => {
    e.preventDefault();
    if (!rejectReason.trim()) { showToast('error','Please provide a rejection reason.'); return; }
    setActionLoading(true);
    try {
      const res = await adminRejectSubmission(subId, rejectReason);
      if (res.success) { showToast('success','Rejected with feedback sent.'); setRejectReason(''); await fetchAll(); }
    } catch(e){ showToast('error', e.message||'Failed.'); }
    finally { setActionLoading(false); }
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    try {
      const res = await adminUpdateRoom(editingRoom.id, {
        room_order: parseInt(editingRoom.room_order),
        title: editingRoom.title, topic: editingRoom.topic,
        difficulty: editingRoom.difficulty, points: parseInt(editingRoom.points),
        problem_statement: editingRoom.problem_statement,
      });
      if (res.success) { showToast('success',`"${editingRoom.title}" updated!`); setEditingRoom(null); await adminGetRooms().then(r=>r.success&&setRooms(r.rooms)); }
    } catch(e){ showToast('error', e.message||'Failed.'); }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const res = await adminCreateRoom({
        room_order: parseInt(newRoom.room_order), title: newRoom.title, topic: newRoom.topic,
        difficulty: newRoom.difficulty, points: parseInt(newRoom.points),
        problem_statement: newRoom.problem_statement,
      });
      if (res.success) {
        showToast('success',`"${newRoom.title}" created!`);
        setNewRoom({ room_order:'', title:'', topic:'', difficulty:'easy', points:'', problem_statement:'' });
        setIsAddingRoom(false);
        await adminGetRooms().then(r=>r.success&&setRooms(r.rooms));
      }
    } catch(e){ showToast('error', e.message||'Failed.'); }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault(); setTeamError(''); setTeamSuccess('');
    try {
      const membersArr = newTeam.members ? newTeam.members.split(',').map(m=>m.trim()).filter(Boolean) : [];
      const res = await adminCreateTeam({ teamName: newTeam.teamName, password: newTeam.password, members: membersArr });
      if (res.success) {
        setTeamSuccess(`Team "${newTeam.teamName}" created!`);
        setNewTeam({ teamName:'', password:'', members:'' });
        await adminGetTeams().then(r=>r.success&&setTeams(r.teams));
      }
    } catch(e){ setTeamError(e.message||'Failed.'); }
  };

  const tabs = [
    { key:'submissions', label:`📥 Queue (${submissions.filter(s=>s.status==='pending').length})` },
    { key:'monitor',     label:`👁️ Live Monitor (${teams.length})` },
    { key:'challenges',  label:`⚔️ Challenges (${rooms.length})` },
    { key:'teams',       label:`👥 Teams (${teams.length})` },
    { key:'leaderboard', label:`🏆 Standings` },
  ];

  const inpEl = (label, props, type='text') => (
    <div>
      <label className="block text-xs mb-1.5 font-mono uppercase tracking-wider" style={{color:`${G}99`}}>{label}</label>
      <input type={type} {...props} className={inp} style={inpSt} />
    </div>
  );

  return (
    <div className="min-h-screen p-4 md:p-6 bg-stone-texture text-gray-200">
      {/* Toast */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 max-w-sm p-4 rounded iron-border shadow-2xl animate-slide-in bg-stone-texture"
          style={notification.type==='success'
            ? {color:'var(--color-success)'}
            : {color:'var(--color-error)'}}>
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium flex-1">{notification.message}</p>
            <button onClick={()=>setNotification(null)} className="text-gray-500 hover:text-white font-bold">×</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 p-5"
        style={panel}>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{
            fontFamily:'var(--font-cinzel)',
            background:`linear-gradient(135deg, var(--color-gold) 0%, #FFF 60%, var(--color-bronze) 100%)`,
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            textShadow:'0 2px 4px rgba(0,0,0,0.8)'
          }}>DUNGEON ORGANIZER</h1>
          <p className="text-xs uppercase tracking-widest mt-1 font-semibold text-gray-400 font-cinzel">Admin Command Console</p>
        </div>
        <button onClick={onLogout}
          className="stone-btn px-5 py-2.5 text-xs">
          Exit Portal
        </button>
      </header>

      {/* Tab Nav */}
      <div className="max-w-7xl mx-auto mb-6 flex border-b gap-1 overflow-x-auto" style={{borderColor:'rgba(204,26,0,0.2)'}}>
        {tabs.map(({key,label}) => (
          <button key={key} onClick={()=>setActiveTab(key)}
            className="pb-4 px-4 text-sm font-semibold transition-all duration-200 whitespace-nowrap"
            style={activeTab===key ? tabActive : tabInactive}>
            {label}
          </button>
        ))}
      </div>

      <main className="max-w-7xl mx-auto">

        {/* ── Submissions Queue ─────────────────────────────────────────────── */}
        {activeTab==='submissions' && (
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            <div className="lg:col-span-4 p-4 h-[calc(100vh-280px)] overflow-y-auto" style={panel}>
              <h3 className="font-bold text-base mb-4 text-gray-200">Pending Review</h3>
              <div className="space-y-2">
                {submissions.filter(s=>s.status==='pending').map(sub=>(
                  <button key={sub.id} onClick={()=>{setSelectedSub(sub);setRejectReason('');}}
                    className="w-full text-left p-4 rounded-xl transition-all duration-200"
                    style={selectedSub?.id===sub.id
                      ? {border:`1px solid ${R}`, background:'rgba(204,26,0,0.1)', boxShadow:`0 0 12px rgba(204,26,0,0.2)`}
                      : {border:'1px solid rgba(255,255,255,0.06)', background:'rgba(20,5,0,0.4)'}}>
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-white text-sm">{sub.teams?.team_name}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full" style={{color:G, background:'rgba(245,166,35,0.1)', border:`1px solid ${G}30`}}>
                        Room {sub.rooms?.room_order}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 block mt-1">{sub.rooms?.title}</span>
                    <span className="text-[10px] text-gray-600 block mt-2 font-mono">
                      {new Date(sub.submitted_at).toLocaleTimeString()}
                    </span>
                  </button>
                ))}
                {submissions.filter(s=>s.status==='pending').length===0 && (
                  <p className="text-gray-600 text-center font-mono text-sm py-12">Queue is empty.</p>
                )}
              </div>

              <h3 className="font-bold text-xs mt-8 mb-3 pt-4 border-t uppercase tracking-widest" style={{borderColor:'rgba(204,26,0,0.15)', color:`${G}60`}}>
                Reviewed
              </h3>
              <div className="space-y-2 opacity-60">
                {submissions.filter(s=>s.status!=='pending').slice(0,12).map(sub=>(
                  <div key={sub.id} className="p-3 rounded-lg flex justify-between items-center text-xs" style={card}>
                    <div>
                      <span className="font-semibold text-gray-300 block">{sub.teams?.team_name}</span>
                      <span className="text-gray-600">{sub.rooms?.title}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sub.status==='accepted'?'text-emerald-400':'text-rose-400'}`}
                      style={{border:`1px solid ${sub.status==='accepted'?'rgba(16,185,129,0.3)':'rgba(204,26,0,0.3)'}`, background:sub.status==='accepted'?'rgba(16,185,129,0.08)':'rgba(204,26,0,0.08)'}}>
                      {sub.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col h-[calc(100vh-280px)]">
              {selectedSub ? (
                <div className="p-6 flex flex-col h-full overflow-y-auto" style={panel}>
                  <div className="pb-4 mb-4 border-b flex justify-between items-start" style={{borderColor:'rgba(204,26,0,0.2)'}}>
                    <div>
                      <span className="text-xs font-mono uppercase tracking-widest" style={{color:G}}>Reviewing Submission</span>
                      <h2 className="text-2xl font-black mt-1 text-white">{selectedSub.teams?.team_name}</h2>
                      <span className="text-xs text-gray-500">Room {selectedSub.rooms?.room_order}: {selectedSub.rooms?.title}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 font-mono block">{new Date(selectedSub.submitted_at).toLocaleTimeString()}</span>
                      <span className="text-sm font-bold block mt-1" style={{color:GB}}>+{selectedSub.rooms?.points} pts</span>
                    </div>
                  </div>
                  <div className="flex-grow flex flex-col my-2">
                    <h4 className="text-xs font-semibold uppercase tracking-widest mb-2 font-mono text-gray-500">Submitted Code</h4>
                    <pre className="flex-grow p-4 rounded-xl text-xs overflow-auto font-mono leading-relaxed max-h-96 min-h-48 whitespace-pre-wrap"
                      style={{background:'rgba(0,0,0,0.6)', border:'1px solid rgba(0,255,0,0.1)', color:'#4ade80'}}>
                      {selectedSub.notes || '// No code submitted.'}
                    </pre>
                  </div>
                  <div className="pt-4 border-t flex flex-col md:flex-row items-end gap-4" style={{borderColor:'rgba(204,26,0,0.2)'}}>
                    <div className="w-full md:flex-grow">
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-2 font-mono" style={{color:`${G}80`}}>Rejection Reason</label>
                      <input type="text" placeholder="e.g. Fails edge case 3..." value={rejectReason}
                        onChange={e=>setRejectReason(e.target.value)} className={inp} style={inpSt} />
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button onClick={e=>handleReject(e,selectedSub.id)} disabled={actionLoading}
                        className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                        style={{background:'rgba(204,26,0,0.15)', border:`1px solid rgba(204,26,0,0.4)`, color:RB}}>
                        ✕ Reject
                      </button>
                      <button onClick={()=>handleAccept(selectedSub.id)} disabled={actionLoading}
                        className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                        style={{background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.4)', color:'#4ade80'}}>
                        ✓ Accept & Unlock
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl p-12 text-center backdrop-blur-xl h-full flex flex-col justify-center items-center" style={panel}>
                  <span className="text-4xl block mb-3 animate-skull">📥</span>
                  <p className="text-gray-600 font-mono text-sm">Select a submission to review.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Live Monitor ──────────────────────────────────────────────────── */}
        {activeTab==='monitor' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{color:G}}>Real-Time Team Progress</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                Auto-refreshes every 15s
              </div>
            </div>
            {teams.length===0 ? (
              <div className="text-center py-16 text-gray-600 font-mono">No teams registered yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {teams.map(team => (
                  <TeamMonitorRow key={team.id} team={team} submissions={submissions} rooms={rooms} />
                ))}
              </div>
            )}

            {/* Submission feed */}
            <h3 className="font-bold text-base mt-8 mb-4" style={{color:G}}>Recent Activity Feed</h3>
            <div className="rounded-2xl p-4" style={panel}>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {submissions.slice(0,20).map(sub=>(
                  <div key={sub.id} className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs" style={card}>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${sub.status==='pending'?'bg-yellow-400 animate-pulse':sub.status==='accepted'?'bg-emerald-400':'bg-red-600'}`}/>
                    <span className="font-bold text-white">{sub.teams?.team_name}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-gray-400 flex-1">{sub.rooms?.title}</span>
                    <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${sub.status==='pending'?'text-yellow-400':sub.status==='accepted'?'text-emerald-400':'text-red-500'}`}
                      style={{border:`1px solid currentColor`, opacity:0.7}}>
                      {sub.status}
                    </span>
                    <span className="text-gray-600 font-mono">{new Date(sub.submitted_at).toLocaleTimeString()}</span>
                  </div>
                ))}
                {submissions.length===0 && <p className="text-gray-600 text-center font-mono text-sm py-6">No activity yet.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── Challenges ────────────────────────────────────────────────────── */}
        {activeTab==='challenges' && (
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            <div className="lg:col-span-5 rounded-2xl p-4 backdrop-blur-xl" style={panel}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-base" style={{color:G}}>Seeded Chambers</h3>
                <button onClick={()=>{setIsAddingRoom(true);setEditingRoom(null);}}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                  style={btnPrimary}>+ Add</button>
              </div>
              <div className="space-y-2">
                {rooms.map(room=>(
                  <div key={room.id} className="p-4 rounded-xl flex justify-between items-center" style={card}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full font-bold" style={{color:G, background:'rgba(245,166,35,0.1)', border:`1px solid ${G}30`}}>
                          Room {room.room_order}
                        </span>
                        <span className="font-bold text-sm text-white">{room.title}</span>
                      </div>
                      <span className="text-xs text-gray-500 block mt-1">
                        {room.topic} · {room.points}pts · {room.difficulty}
                      </span>
                    </div>
                    <button onClick={()=>{setEditingRoom(room);setIsAddingRoom(false);}}
                      className="px-3 py-1 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
                      style={{border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)'}}>
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              {(editingRoom||isAddingRoom) ? (
                <div className="rounded-2xl p-6 backdrop-blur-xl" style={panel}>
                  <h3 className="font-bold text-base mb-4" style={{color:G}}>
                    {editingRoom ? `Edit Room ${editingRoom.room_order}` : 'New Challenge'}
                  </h3>
                  <form onSubmit={editingRoom?handleUpdateRoom:handleCreateRoom} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {inpEl('Room Order', { type:'number', value: editingRoom?editingRoom.room_order:newRoom.room_order, onChange:e=>editingRoom?setEditingRoom({...editingRoom,room_order:e.target.value}):setNewRoom({...newRoom,room_order:e.target.value}), required:true, placeholder:'e.g. 1' })}
                      {inpEl('Title', { value:editingRoom?editingRoom.title:newRoom.title, onChange:e=>editingRoom?setEditingRoom({...editingRoom,title:e.target.value}):setNewRoom({...newRoom,title:e.target.value}), required:true, placeholder:'Chamber name' })}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">{inpEl('Topic', { value:editingRoom?editingRoom.topic:newRoom.topic, onChange:e=>editingRoom?setEditingRoom({...editingRoom,topic:e.target.value}):setNewRoom({...newRoom,topic:e.target.value}), required:true, placeholder:'e.g. Recursion' })}</div>
                      <div>
                        <label className="block text-xs mb-1.5 font-mono uppercase tracking-wider" style={{color:`${G}99`}}>Difficulty</label>
                        <select value={editingRoom?editingRoom.difficulty:newRoom.difficulty}
                          onChange={e=>editingRoom?setEditingRoom({...editingRoom,difficulty:e.target.value}):setNewRoom({...newRoom,difficulty:e.target.value})}
                          className={inp} style={inpSt}>
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                          <option value="boss">Boss</option>
                        </select>
                      </div>
                    </div>
                    {inpEl('Points', { type:'number', value:editingRoom?editingRoom.points:newRoom.points, onChange:e=>editingRoom?setEditingRoom({...editingRoom,points:e.target.value}):setNewRoom({...newRoom,points:e.target.value}), required:true, placeholder:'e.g. 100' })}
                    <div>
                      <label className="block text-xs mb-1.5 font-mono uppercase tracking-wider" style={{color:`${G}99`}}>Problem Statement</label>
                      <textarea value={editingRoom?editingRoom.problem_statement||'':newRoom.problem_statement}
                        onChange={e=>editingRoom?setEditingRoom({...editingRoom,problem_statement:e.target.value}):setNewRoom({...newRoom,problem_statement:e.target.value})}
                        className="w-full h-44 p-3 rounded-lg text-xs font-mono leading-relaxed outline-none transition-all"
                        style={inpSt} placeholder="Write problem markdown here..." required />
                    </div>
                    <div className="flex gap-3 justify-end">
                      <button type="button" onClick={()=>{setEditingRoom(null);setIsAddingRoom(false);}}
                        className="px-4 py-2 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
                        style={{border:'1px solid rgba(255,255,255,0.08)'}}>Cancel</button>
                      <button type="submit" className="px-5 py-2 rounded-lg text-xs font-bold text-white uppercase tracking-wider"
                        style={btnPrimary}>
                        {editingRoom ? 'Save Changes' : 'Create Challenge'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="rounded-2xl p-12 text-center backdrop-blur-xl h-full flex flex-col justify-center items-center" style={panel}>
                  <span className="text-4xl block mb-3">🛠️</span>
                  <p className="text-gray-600 font-mono text-sm">Select a challenge to edit, or add new.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Teams ─────────────────────────────────────────────────────────── */}
        {activeTab==='teams' && (
          <div className="rounded-2xl p-6 backdrop-blur-xl max-w-5xl mx-auto" style={panel}>
            <h3 className="font-bold text-base mb-4" style={{color:G}}>Registered Teams ({teams.length})</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase font-mono border-b" style={{borderColor:'rgba(204,26,0,0.2)', color:`${G}60`}}>
                  <th className="py-3 px-2">Team</th>
                  <th className="py-3 px-2">Members</th>
                  <th className="py-3 px-2 text-right">Registered</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(t=>(
                  <tr key={t.id} className="text-sm border-b transition-colors" style={{borderColor:'rgba(204,26,0,0.08)'}}>
                    <td className="py-3 px-2 font-bold text-white">{t.team_name}</td>
                    <td className="py-3 px-2 text-gray-400 text-xs">{t.members?.length>0?t.members.join(', '):'—'}</td>
                    <td className="py-3 px-2 text-right text-gray-600 text-xs font-mono">{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {teams.length===0 && (
                  <tr><td colSpan="3" className="py-10 text-center text-gray-600 font-mono text-xs">No teams registered.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Leaderboard ───────────────────────────────────────────────────── */}
        {activeTab==='leaderboard' && (
          <div className="max-w-4xl mx-auto rounded-2xl p-5 backdrop-blur-xl" style={panel}>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{color:G}}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{background:RB}}/>
              Live Standings
            </h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase font-mono border-b" style={{borderColor:'rgba(204,26,0,0.2)', color:`${G}60`}}>
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-3">Team</th>
                  <th className="py-3 px-3 text-center">Rooms</th>
                  <th className="py-3 px-3 text-right">Points</th>
                  <th className="py-3 px-3 text-right">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map(row=>(
                  <tr key={row.teamName} className="text-sm border-b transition-colors" style={{borderColor:'rgba(204,26,0,0.08)'}}>
                    <td className="py-3.5 px-3 font-mono">
                      {row.rank===1?'🥇':row.rank===2?'🥈':row.rank===3?'🥉':`#${row.rank}`}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-white">{row.teamName}</td>
                    <td className="py-3.5 px-3 text-center font-mono text-gray-400">{row.roomsCleared}</td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold" style={{color:GB}}>{row.totalPoints}</td>
                    <td className="py-3.5 px-3 text-right font-mono text-gray-600 text-xs">
                      {row.lastSubmissionAt ? new Date(row.lastSubmissionAt).toLocaleTimeString() : '—'}
                    </td>
                  </tr>
                ))}
                {leaderboard.length===0 && (
                  <tr><td colSpan="5" className="py-10 text-center text-gray-600 font-mono text-xs">No active teams.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
