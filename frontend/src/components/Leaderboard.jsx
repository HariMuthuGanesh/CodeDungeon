import { useState, useEffect } from 'react';

// ─── Theme ───────────────────────────────────────────────────────────────────
const R = '#CC1A00'; const RB = '#FF3333'; const G = '#F5A623'; const GB = '#FFD700';

const rankIcon = (r) => r===1?'🥇':r===2?'🥈':r===3?'🥉':`#${r}`;

export default function Leaderboard({ leaderboard, currentTeamName }) {
  const [prevOrder, setPrevOrder] = useState([]);
  const [flashMap, setFlashMap]   = useState({});

  useEffect(() => {
    if (!prevOrder.length) { setPrevOrder(leaderboard.map(r=>r.teamName)); return; }
    const newOrd = leaderboard.map(r=>r.teamName);
    const changed = {};
    newOrd.forEach((n,i) => {
      const p = prevOrder.indexOf(n);
      if (p!==-1 && p!==i) changed[n] = p>i ? 'up' : 'down';
    });
    if (Object.keys(changed).length) {
      setFlashMap(changed);
      const t = setTimeout(()=>setFlashMap({}),1500);
      setPrevOrder(newOrd);
      return ()=>clearTimeout(t);
    }
    setPrevOrder(newOrd);
  }, [leaderboard]);

  return (
    <div className="rounded-2xl p-5 backdrop-blur-xl sticky top-8"
      style={{ background:'rgba(13,3,0,0.8)', border:`1px solid rgba(204,26,0,0.3)`, boxShadow:`0 0 30px rgba(204,26,0,0.15)` }}>
      <div className="flex items-center gap-2 mb-5">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{background:RB}}/>
          <span className="relative inline-flex rounded-full h-3 w-3" style={{background:RB}}/>
        </span>
        <h3 className="text-sm font-bold uppercase tracking-widest" style={{color:G}}>Live Standings</h3>
      </div>

      {leaderboard.length===0 ? (
        <div className="py-10 text-center">
          <span className="text-3xl block mb-2 animate-skull">💀</span>
          <p className="text-gray-600 font-mono text-xs">No teams yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {leaderboard.map(row => {
            const isMe = row.teamName === currentTeamName;
            const flash = flashMap[row.teamName];
            return (
              <div key={row.teamName}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-500 ${flash==='up'?'animate-rank-up':flash==='down'?'animate-rank-down':''}`}
                style={isMe
                  ? {background:'rgba(204,26,0,0.15)', border:`1px solid rgba(204,26,0,0.4)`, boxShadow:`0 0 12px rgba(204,26,0,0.2)`}
                  : {background:'rgba(255,255,255,0.02)', border:'1px solid transparent'}}>
                <span className="font-mono text-sm w-7 text-center shrink-0">{rankIcon(row.rank)}</span>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold truncate"
                    style={{color: isMe ? G : '#d1d5db'}} title={row.teamName}>
                    {row.teamName}
                    {isMe && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider" style={{color:RB}}> YOU</span>}
                  </span>
                  <span className="text-[10px] text-gray-600 font-mono">{row.roomsCleared} rooms</span>
                </div>
                <span className="font-mono text-sm font-bold shrink-0" style={{color: isMe ? GB : G}}>
                  {row.totalPoints}<span className="text-[10px] font-normal text-gray-600 ml-0.5">pts</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
