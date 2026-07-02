import { useState, useEffect, useRef } from 'react';

const R='#CC1A00'; const RB='#FF3333'; const G='#F5A623'; const GB='#FFD700';

const DIFF_STYLES = {
  easy:   { label:'Novice',  glow:`rgba(245,166,35,0.5)`,  border:'rgba(245,166,35,0.4)',  bg:'rgba(245,166,35,0.06)',   icon:'🗝️',  skull:'💀' },
  medium: { label:'Cursed',  glow:`rgba(204,26,0,0.6)`,    border:'rgba(204,26,0,0.5)',    bg:'rgba(204,26,0,0.08)',     icon:'🔥',  skull:'💀💀' },
  hard:   { label:'Infernal',glow:`rgba(180,0,0,0.8)`,     border:'rgba(200,0,0,0.7)',     bg:'rgba(150,0,0,0.1)',       icon:'⚠️', skull:'💀💀💀' },
  boss:   { label:'BOSS',    glow:`rgba(255,215,0,0.7)`,   border:'rgba(255,215,0,0.6)',   bg:'rgba(255,215,0,0.08)',    icon:'☠️',  skull:'☠️☠️☠️' },
};

// ─── Torch flame component ────────────────────────────────────────────────────
function Torch({ side = 'left' }) {
  return (
    <div className={`absolute top-4 ${side==='left'?'left-3':'right-3'} flex flex-col items-center`}>
      <div className="relative">
        {/* Flame */}
        <div className="w-4 h-6 animate-torch" style={{
          background:'radial-gradient(ellipse at bottom, #FF6600 0%, #FF2200 40%, rgba(200,0,0,0) 100%)',
          borderRadius:'60% 60% 40% 40%',
          filter:'blur(1px)',
        }}/>
        {/* Torch handle */}
        <div className="w-2 h-5 mx-auto rounded-sm" style={{background:'linear-gradient(180deg,#5a3000,#2a1500)'}}/>
      </div>
      {/* Glow on wall */}
      <div className="absolute inset-0 rounded-full" style={{background:'radial-gradient(circle,rgba(255,80,0,0.25) 0%,transparent 70%)',width:'60px',height:'60px',transform:'translate(-25%,-20%)'}}/>
    </div>
  );
}

// ─── Blood drip component ─────────────────────────────────────────────────────
function BloodDrips({ count = 3 }) {
  return (
    <div className="absolute top-0 left-0 right-0 flex justify-around pointer-events-none overflow-hidden h-8">
      {Array.from({length:count}).map((_,i) => (
        <div key={i} className="animate-blood-drip"
          style={{
            width:'3px', background:'linear-gradient(180deg,#8b0000,#cc0000,transparent)',
            borderRadius:'0 0 50% 50%', animationDelay:`${i*0.9}s`,
            animationDuration:`${2.5+i*0.7}s`,
            height:`${20+i*8}px`,
          }}/>
      ))}
    </div>
  );
}

// ─── Rune particles ───────────────────────────────────────────────────────────
function RuneParticles() {
  const runes = ['ᚱ','ᚠ','ᚹ','ᛏ','ᚷ','ᚾ','ᛉ','ᛗ'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {runes.map((r,i) => (
        <span key={i} className="absolute text-xs font-mono animate-float-rune select-none"
          style={{
            left:`${8+i*12}%`,
            bottom:`${5+((i*17)%30)}%`,
            color: i%2===0 ? `${G}60` : `${R}60`,
            animationDelay:`${i*0.4}s`,
            animationDuration:`${2+i*0.5}s`,
          }}>
          {r}
        </span>
      ))}
    </div>
  );
}

// ─── Single Door ──────────────────────────────────────────────────────────────
function DungeonDoor({ room, isActive, onClick, isCurrent }) {
  const diff = DIFF_STYLES[room.difficulty] || DIFF_STYLES.easy;
  const [hovered, setHovered] = useState(false);

  const statusColor = room.cleared ? '#4ade80' : room.locked ? '#4b5563' : R;
  const statusLabel = room.cleared ? 'CLEARED' : room.locked ? 'SEALED' : 'ENTER';

  return (
    <div
      onClick={room.locked ? undefined : onClick}
      onMouseEnter={() => !room.locked && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative flex flex-col select-none transition-all duration-500 ${room.locked?'cursor-not-allowed opacity-60':'cursor-pointer'}`}
      style={{
        transform: hovered ? 'translateY(-8px) scale(1.02)' : isActive ? 'translateY(-4px)' : 'none',
      }}
    >
      {/* Main door frame */}
      <div className="relative rounded-t-[50%] overflow-hidden"
        style={{
          width:'100%',
          minHeight:'220px',
          background: room.cleared
            ? 'linear-gradient(180deg,rgba(0,30,0,0.9),rgba(0,10,0,0.8))'
            : room.locked
            ? 'linear-gradient(180deg,rgba(10,5,0,0.95),rgba(5,2,0,0.9))'
            : `linear-gradient(180deg,rgba(30,5,0,0.95) 0%,rgba(15,2,0,0.9) 100%)`,
          border: `2px solid ${isActive ? R : room.cleared ? 'rgba(16,185,129,0.5)' : room.locked ? 'rgba(50,30,20,0.4)' : diff.border}`,
          boxShadow: room.locked ? 'none'
            : hovered || isActive ? `0 0 30px ${diff.glow}, 0 0 60px ${diff.glow}40, inset 0 0 20px ${diff.glow}10`
            : `0 0 15px ${diff.glow}40`,
        }}
      >
        {/* Torches */}
        {!room.locked && <Torch side="left"/>}
        {!room.locked && <Torch side="right"/>}

        {/* Blood drips on non-cleared doors */}
        {!room.cleared && !room.locked && <BloodDrips count={3} />}

        {/* Rune particles on active */}
        {isActive && <RuneParticles />}

        {/* Door wood panels */}
        <div className="absolute inset-4 top-8 flex flex-col gap-2">
          {[0,1,2].map(i => (
            <div key={i} className="flex-1 rounded-sm" style={{
              background: room.cleared
                ? 'rgba(0,40,0,0.3)'
                : room.locked
                ? 'rgba(20,10,5,0.4)'
                : `rgba(40,5,0,${0.3+i*0.05})`,
              border:`1px solid ${room.cleared?'rgba(16,185,129,0.1)':room.locked?'rgba(40,20,10,0.2)':'rgba(180,30,0,0.15)'}`,
            }}/>
          ))}
        </div>

        {/* Center icon / skull */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-4xl mb-2 ${!room.locked && !room.cleared ? 'animate-skull' : ''}`}>
            {room.cleared ? '✅' : room.locked ? '🔒' : diff.skull}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-widest"
            style={{color: room.cleared?'#4ade80':room.locked?'#374151':diff.border}}>
            {diff.label}
          </div>
        </div>

        {/* Door handle */}
        <div className="absolute right-6 top-1/2 w-3 h-3 rounded-full -translate-y-1/2"
          style={{background:`linear-gradient(135deg,${G},#a06010)`, boxShadow:`0 0 6px ${G}80`}}/>

        {/* Lightning flash overlay on active */}
        {isActive && (
          <div className="absolute inset-0 bg-red-100 animate-lightning rounded-t-[50%] pointer-events-none"/>
        )}

        {/* Cleared fog effect */}
        {room.cleared && (
          <div className="absolute inset-0 rounded-t-[50%]" style={{background:'radial-gradient(circle at center,rgba(0,60,0,0.2) 0%,transparent 70%)'}}/>
        )}
      </div>

      {/* Door base / step */}
      <div className="h-4 rounded-b-sm" style={{
        background: room.cleared
          ? 'linear-gradient(180deg,rgba(0,30,0,0.8),rgba(0,10,0,0.6))'
          : room.locked
          ? 'linear-gradient(180deg,rgba(10,5,0,0.9),rgba(5,2,0,0.7))'
          : `linear-gradient(180deg,rgba(60,10,0,0.8),rgba(30,5,0,0.6))`,
        border: `1px solid ${room.cleared?'rgba(16,185,129,0.3)':room.locked?'rgba(40,20,10,0.3)':diff.border}`,
        boxShadow: room.cleared?'none':room.locked?'none':`0 4px 20px ${diff.glow}40`,
      }}/>

      {/* Door label below */}
      <div className="mt-3 text-center px-2">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{color:`${G}60`}}>
            Chamber {room.room_order}
          </span>
        </div>
        <span className="block font-bold text-sm text-white truncate animate-red-flicker" title={room.title}>
          {room.title}
        </span>
        <span className="block text-[10px] text-gray-600 mt-0.5 font-mono">{room.topic}</span>
        <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
          style={{
            background: room.cleared?'rgba(16,185,129,0.1)':room.locked?'rgba(50,30,20,0.2)':`rgba(204,26,0,0.1)`,
            border:`1px solid ${statusColor}40`, color:statusColor,
            boxShadow: room.cleared||room.locked?'none':`0 0 8px ${R}40`,
          }}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
}

// ─── DungeonHall ──────────────────────────────────────────────────────────────
export default function DungeonHall({ rooms, activeRoomId, onSelectRoom }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!rooms.length) return;
    const idx = rooms.findIndex(r => r.id === activeRoomId);
    if (idx !== -1) setCurrentIndex(idx);
  }, [activeRoomId, rooms]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key==='ArrowRight' || e.key==='ArrowDown') setCurrentIndex(p => Math.min(p+1, rooms.length-1));
      if (e.key==='ArrowLeft'  || e.key==='ArrowUp')   setCurrentIndex(p => Math.max(p-1, 0));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [rooms.length]);

  if (!rooms.length) {
    return (
      <div className="flex items-center justify-center min-h-64 rounded-2xl" style={{background:'rgba(13,3,0,0.6)', border:'1px solid rgba(204,26,0,0.15)'}}>
        <div className="text-center">
          <div className="text-6xl mb-4 animate-skull">💀</div>
          <p className="text-gray-600 font-mono text-sm">The dungeon awaits...</p>
        </div>
      </div>
    );
  }

  const VISIBLE = 3;
  const start = Math.max(0, Math.min(currentIndex - 1, rooms.length - VISIBLE));
  const visible = rooms.slice(start, start + VISIBLE);

  const clearedCount = rooms.filter(r => r.cleared).length;
  const progress     = Math.round((clearedCount / rooms.length) * 100);

  return (
    <div>
      {/* ─── Hall header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider"
            style={{fontFamily:'Cinzel, serif', background:`linear-gradient(135deg,${RB},${G})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>
            The Dungeon Corridor
          </h2>
          <p className="text-xs text-gray-600 font-mono mt-1">
            {clearedCount} of {rooms.length} chambers escaped
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">Progress</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-24 h-1.5 rounded-full" style={{background:'rgba(255,255,255,0.06)'}}>
              <div className="h-1.5 rounded-full transition-all duration-700"
                style={{width:`${progress}%`, background:`linear-gradient(90deg,${R},${G})`, boxShadow:`0 0 6px ${R}`}}/>
            </div>
            <span className="text-xs font-bold font-mono" style={{color:G}}>{progress}%</span>
          </div>
        </div>
      </div>

      {/* ─── Corridor environment ─────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative rounded-2xl p-6 md:p-8 overflow-hidden"
        style={{
          background:'linear-gradient(180deg,rgba(8,2,0,0.95) 0%,rgba(15,3,0,0.9) 100%)',
          border:'1px solid rgba(100,20,0,0.4)',
          boxShadow:'inset 0 0 60px rgba(0,0,0,0.8), 0 0 40px rgba(100,10,0,0.15)',
          minHeight:'380px',
        }}
      >
        {/* Stone wall texture overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
          backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 30px,rgba(255,255,255,0.03) 30px,rgba(255,255,255,0.03) 31px), repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,0.02) 40px,rgba(255,255,255,0.02) 41px)',
        }}/>

        {/* Ceiling chains */}
        <div className="absolute top-0 left-0 right-0 flex justify-around pointer-events-none">
          {[0,1,2,3,4].map(i=>(
            <div key={i} className="w-px" style={{
              height:`${15+i%3*8}px`,
              background:'linear-gradient(180deg,rgba(80,40,10,0.8),rgba(60,30,5,0.3))',
            }}/>
          ))}
        </div>

        {/* Floor glow */}
        <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
          style={{background:'linear-gradient(0deg,rgba(100,10,0,0.15) 0%,transparent 100%)'}}/>

        {/* Fog bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none animate-smoke"
          style={{background:'linear-gradient(0deg,rgba(200,20,0,0.04) 0%,transparent 100%)', animationDuration:'5s'}}/>

        {/* ── Door grid ──────────────────────────────────────────────────── */}
        <div className="relative grid grid-cols-3 gap-4 md:gap-6">
          {visible.map((room) => (
            <DungeonDoor
              key={room.id}
              room={room}
              isActive={room.id === activeRoomId}
              isCurrent={room.id === activeRoomId}
              onClick={() => onSelectRoom(room.id)}
            />
          ))}
        </div>
      </div>

      {/* ─── Navigation ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-4 px-1">
        <button
          onClick={() => setCurrentIndex(p => Math.max(0, p-1))}
          disabled={currentIndex===0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{border:`1px solid rgba(204,26,0,0.3)`, color:G, background:'rgba(204,26,0,0.05)'}}>
          ← Prev
        </button>

        {/* Dot indicator */}
        <div className="flex items-center gap-2">
          {rooms.map((r, i) => (
            <button key={r.id} onClick={() => setCurrentIndex(i)}
              className="transition-all duration-300"
              style={{
                width: i===currentIndex ? '20px' : '6px',
                height:'6px', borderRadius:'3px',
                background: r.cleared ? '#4ade80' : i===currentIndex ? G : r.locked ? 'rgba(255,255,255,0.1)' : `${R}80`,
                boxShadow: i===currentIndex ? `0 0 8px ${G}` : 'none',
              }}/>
          ))}
        </div>

        <button
          onClick={() => setCurrentIndex(p => Math.min(rooms.length-1, p+1))}
          disabled={currentIndex>=rooms.length-1}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{border:`1px solid rgba(204,26,0,0.3)`, color:G, background:'rgba(204,26,0,0.05)'}}>
          Next →
        </button>
      </div>

      {/* ─── Keyboard hint ────────────────────────────────────────────────── */}
      <p className="text-center text-[10px] text-gray-700 font-mono mt-3 uppercase tracking-widest">
        ← → Arrow keys to navigate · Click a door to enter
      </p>
    </div>
  );
}
