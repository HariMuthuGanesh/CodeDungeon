import { useState, useEffect, useRef } from 'react';

const R='#CC1A00'; const RB='#FF3333'; const G='#F5A623'; const GB='#FFD700';

const DIFF_STYLES = {
  easy:   { label:'Novice',  glow:`rgba(212,175,55,0.5)`,  border:'rgba(212,175,55,0.4)',  bg:'rgba(212,175,55,0.06)',   icon:'🗝️',  skull:'🛡️' },
  medium: { label:'Cursed',  glow:`rgba(139,107,63,0.6)`,  border:'rgba(139,107,63,0.5)',  bg:'rgba(139,107,63,0.08)',   icon:'🔥',  skull:'⚔️' },
  hard:   { label:'Infernal',glow:`rgba(139,30,30,0.8)`,   border:'rgba(139,30,30,0.7)',   bg:'rgba(139,30,30,0.1)',     icon:'⚠️', skull:'🗡️' },
  boss:   { label:'BOSS',    glow:`rgba(255,215,0,0.7)`,   border:'rgba(255,215,0,0.6)',   bg:'rgba(255,215,0,0.08)',    icon:'☠️',  skull:'🐉' },
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

// ─── Vines component ─────────────────────────────────────────────────────
function Vines({ count = 3 }) {
  return (
    <div className="absolute top-0 left-0 right-0 flex justify-around pointer-events-none overflow-hidden h-12">
      {Array.from({length:count}).map((_,i) => (
        <div key={i}
          style={{
            width:`${3+i}px`, background:'linear-gradient(180deg,#2A3B22,#1A2B12,transparent)',
            borderRadius:'0 0 50% 50%',
            height:`${30+i*12}px`,
            opacity: 0.7
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
        <span key={i} className="absolute text-xs font-mono animate-pulse select-none"
          style={{
            left:`${8+i*12}%`,
            bottom:`${5+((i*17)%30)}%`,
            color: i%2===0 ? `var(--color-gold)` : `var(--color-bronze)`,
            opacity: 0.6,
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
      <div className="relative rounded-t-full overflow-hidden bg-stone-texture iron-border"
        style={{
          width:'100%',
          minHeight:'220px',
          border: `3px solid ${isActive ? 'var(--color-gold)' : room.cleared ? 'var(--color-success)' : room.locked ? 'var(--color-stone-secondary)' : diff.border}`,
          boxShadow: room.locked ? 'none'
            : hovered || isActive ? `0 0 30px ${diff.glow}, 0 0 60px ${diff.glow}40, inset 0 0 20px ${diff.glow}10`
            : `0 0 15px ${diff.glow}40`,
        }}
      >
        {/* Torches */}
        {!room.locked && <Torch side="left"/>}
        {!room.locked && <Torch side="right"/>}

        {/* Vines on non-cleared doors */}
        {!room.cleared && !room.locked && <Vines count={3} />}

        {/* Rune particles on active */}
        {isActive && <RuneParticles />}

        {/* Door wood panels */}
        <div className="absolute inset-4 top-8 flex flex-col gap-2">
          {[0,1,2].map(i => (
            <div key={i} className="flex-1 rounded" style={{
              background: room.cleared
                ? 'rgba(76,175,80,0.1)'
                : room.locked
                ? 'rgba(27,31,36,0.4)'
                : `rgba(139,107,63,${0.1+i*0.05})`,
              border:`1px solid ${room.cleared?'rgba(76,175,80,0.2)':room.locked?'rgba(91,97,106,0.2)':'rgba(139,107,63,0.3)'}`,
            }}/>
          ))}
        </div>

        {/* Center icon / skull */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-4xl mb-2`}>
            {room.cleared ? '✅' : room.locked ? '🔒' : diff.skull}
          </div>
          <div className="text-[10px] font-cinzel uppercase tracking-widest font-bold"
            style={{color: room.cleared?'var(--color-success)':room.locked?'#5B616A':diff.border}}>
            {diff.label}
          </div>
        </div>

        {/* Door handle */}
        <div className="absolute right-6 top-1/2 w-4 h-4 rounded-full -translate-y-1/2"
          style={{background:`linear-gradient(135deg,var(--color-gold),var(--color-bronze))`, boxShadow:`0 0 6px rgba(212,175,55,0.8)`, border:'1px solid #111'}}/>

        {/* Cleared fog effect */}
        {room.cleared && (
          <div className="absolute inset-0 rounded-t-[50%]" style={{background:'radial-gradient(circle at center,rgba(76,175,80,0.1) 0%,transparent 70%)'}}/>
        )}
      </div>

      {/* Door base / step */}
      <div className="h-4 rounded-b bg-stone-texture iron-border" style={{
        boxShadow: room.cleared?'none':room.locked?'none':`0 4px 20px ${diff.glow}40`,
        marginTop: '-2px'
      }}/>

      {/* Door label below */}
      <div className="mt-3 text-center px-2">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-[10px] font-cinzel font-bold uppercase tracking-widest text-gray-400">
            Chamber {room.room_order}
          </span>
        </div>
        <span className="block font-bold text-sm text-gray-200 truncate font-inter" title={room.title}>
          {room.title}
        </span>
        <span className="block text-[10px] text-gray-500 mt-0.5 font-cinzel">{room.topic}</span>
        <span className="inline-block mt-2 px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider iron-border"
          style={{
            background: 'var(--color-stone-primary)',
            color: room.cleared ? 'var(--color-success)' : room.locked ? 'var(--color-iron)' : 'var(--color-gold)',
          }}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
}

// ─── DungeonHall ──────────────────────────────────────────────────────────────
export default function DungeonHall({ rooms, activeRoomId, onSelectRoom }) {
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

  // Partition rooms by section
  const section1Rooms = rooms.filter(r => r.section === 1);
  const section2Rooms = rooms.filter(r => r.section === 2);
  const section3Rooms = rooms.filter(r => r.section === 3);

  const clearedCount = rooms.filter(r => r.cleared).length;
  const progress     = Math.round((clearedCount / rooms.length) * 100);

  const renderSection = (title, subtitle, sectionRooms, sectionNum) => (
    <div className="mb-10 animate-fade-in">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-4 px-1">
        <span className="text-sm font-mono text-amber-500/80 font-bold">
          [ SECTION {sectionNum === 1 ? 'I' : sectionNum === 2 ? 'II' : 'III'} ]
        </span>
        <h3 className="text-lg font-cinzel font-black tracking-wider text-white uppercase">
          {title}
        </h3>
        <span className="hidden sm:inline text-gray-700 font-mono">·</span>
        <span className="text-xs text-gray-400 font-inter italic">{subtitle}</span>
      </div>

      {/* Corridor block */}
      <div
        className="relative rounded-2xl p-6 md:p-8 overflow-hidden bg-stone-texture"
        style={{
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.85)',
          background: 'var(--color-stone-secondary)',
          border: '3px solid var(--color-iron)'
        }}
      >
        <Vines count={4} />

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {sectionRooms.map((room) => (
            <DungeonDoor
              key={room.id}
              room={room}
              isActive={room.id === activeRoomId}
              isCurrent={room.id === activeRoomId}
              onClick={() => onSelectRoom(room.id)}
            />
          ))}
          {sectionRooms.length === 0 && (
            <p className="text-center py-6 text-gray-600 font-mono text-xs col-span-3">This wing of the dungeon is locked.</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      {/* ─── Global Progress Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8 px-1">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-wider"
            style={{fontFamily:'var(--font-cinzel)', background:`linear-gradient(135deg,var(--color-gold),#FFF)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', textShadow:'0 2px 4px rgba(0,0,0,0.8)'}}>
            The Dungeon Corridor
          </h2>
          <p className="text-xs text-gray-400 font-cinzel mt-1">
            {clearedCount} of {rooms.length} chambers cleared
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-gray-500 font-cinzel uppercase tracking-widest">Progress</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-24 h-2 rounded bg-stone-texture iron-border">
              <div className="h-full transition-all duration-700"
                style={{width:`${progress}%`, background:`linear-gradient(90deg,var(--color-bronze),var(--color-gold))`, boxShadow:`0 0 6px var(--color-gold)`}}/>
            </div>
            <span className="text-xs font-bold font-inter text-gray-200">{progress}%</span>
          </div>
        </div>
      </div>

      {/* ─── Three Dungeon Sections ────────────────────────────────────────── */}
      {renderSection(
        "Chambers of Shuffled Sigils", 
        "Rearrange code blocks to rebuild ancient spells & compile solutions", 
        section1Rooms, 
        1
      )}
      
      {renderSection(
        "The Ancient Library", 
        "Predict sequences and find patterns left behind by the arch-mages", 
        section2Rooms, 
        2
      )}

      {renderSection(
        "The Final Gate", 
        "Implement complex logic to defeat the Boss and escape the dungeon", 
        section3Rooms, 
        3
      )}
      
      {/* Keyboard hint */}
      <p className="text-center text-[10px] text-gray-700 font-mono mt-4 uppercase tracking-widest">
        Click a door to enter the chamber
      </p>
    </div>
  );
}
