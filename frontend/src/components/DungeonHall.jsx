import { useState, useEffect, useRef } from 'react';

const R = '#CC1A00'; const RB = '#FF3333'; const G = '#F5A623'; const GB = '#FFD700';

const DIFF_STYLES = {
  easy: { label: 'Novice', glow: `rgba(212,175,55,0.5)`, border: 'rgba(212,175,55,0.4)', bg: 'rgba(212,175,55,0.06)', icon: '🗝️', skull: '🛡️' },
  medium: { label: 'Cursed', glow: `rgba(139,107,63,0.6)`, border: 'rgba(139,107,63,0.5)', bg: 'rgba(139,107,63,0.08)', icon: '🔥', skull: '⚔️' },
  hard: { label: 'Infernal', glow: `rgba(139,30,30,0.8)`, border: 'rgba(139,30,30,0.7)', bg: 'rgba(139,30,30,0.1)', icon: '⚠️', skull: '🗡️' },
  boss: { label: 'BOSS', glow: `rgba(255,215,0,0.7)`, border: 'rgba(255,215,0,0.6)', bg: 'rgba(255,215,0,0.08)', icon: '☠️', skull: '🐉' },
};

// ─── Torch flame component ────────────────────────────────────────────────────
function Torch({ side = 'left' }) {
  return (
    <div className={`absolute top-4 ${side === 'left' ? 'left-3' : 'right-3'} flex flex-col items-center`}>
      <div className="relative">
        {/* Flame */}
        <div className="w-4 h-6 animate-torch" style={{
          background: 'radial-gradient(ellipse at bottom, #FF6600 0%, #FF2200 40%, rgba(200,0,0,0) 100%)',
          borderRadius: '60% 60% 40% 40%',
          filter: 'blur(1px)',
        }} />
        {/* Torch handle */}
        <div className="w-2 h-5 mx-auto rounded-sm" style={{ background: 'linear-gradient(180deg,#5a3000,#2a1500)' }} />
      </div>
      {/* Glow on wall */}
      <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle,rgba(255,80,0,0.25) 0%,transparent 70%)', width: '60px', height: '60px', transform: 'translate(-25%,-20%)' }} />
    </div>
  );
}

// ─── Vines component ─────────────────────────────────────────────────────
function Vines({ count = 3 }) {
  return (
    <div className="absolute top-0 left-0 right-0 flex justify-around pointer-events-none overflow-hidden h-12 z-10">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}
          style={{
            width: `${3 + i}px`, background: 'linear-gradient(180deg,#2A3B22,#1A2B12,transparent)',
            borderRadius: '0 0 50% 50%',
            height: `${30 + i * 12}px`,
            opacity: 0.7
          }} />
      ))}
    </div>
  );
}

// ─── Rune particles ───────────────────────────────────────────────────────────
function RuneParticles() {
  const runes = ['ᚱ', 'ᚠ', 'ᚹ', 'ᛏ', 'ᚷ', 'ᚾ', 'ᛉ', 'ᛗ'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {runes.map((r, i) => (
        <span key={i} className="absolute text-xs font-mono animate-pulse select-none"
          style={{
            left: `${8 + i * 12}%`,
            bottom: `${5 + ((i * 17) % 30)}%`,
            color: i % 2 === 0 ? `var(--color-gold)` : `var(--color-bronze)`,
            opacity: 0.6,
            animationDelay: `${i * 0.4}s`,
            animationDuration: `${2 + i * 0.5}s`,
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
      className={`relative flex flex-col select-none transition-all duration-500 ${room.locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      style={{
        transform: hovered ? 'translateY(-8px) scale(1.02)' : isActive ? 'translateY(-4px)' : 'none',
      }}
    >
      {/* Main door frame */}
      <div className="relative rounded-t-[40%] overflow-hidden bg-stone-texture iron-border"
        style={{
          width: '100%',
          minHeight: '140px',
          border: `3px solid ${isActive ? 'var(--color-gold)' : room.cleared ? 'var(--color-success)' : room.locked ? 'var(--color-stone-secondary)' : diff.border}`,
          boxShadow: room.locked ? 'none'
            : hovered || isActive ? `0 0 30px ${diff.glow}, 0 0 60px ${diff.glow}40, inset 0 0 20px ${diff.glow}10`
              : `0 0 15px ${diff.glow}40`,
        }}
      >
        {/* Torches */}
        {!room.locked && <Torch side="left" />}
        {!room.locked && <Torch side="right" />}

        {/* Vines on non-cleared doors */}
        {!room.cleared && !room.locked && <Vines count={3} />}

        {/* Rune particles on active */}
        {isActive && <RuneParticles />}

        {/* Door wood panels */}
        <div className="absolute inset-3 top-4 flex flex-col gap-2 z-10">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex-1 rounded" style={{
              background: room.cleared
                ? 'rgba(76,175,80,0.1)'
                : room.locked
                  ? 'rgba(27,31,36,0.4)'
                  : `rgba(139,107,63,${0.1 + i * 0.05})`,
              border: `1px solid ${room.cleared ? 'rgba(76,175,80,0.2)' : room.locked ? 'rgba(91,97,106,0.2)' : 'rgba(139,107,63,0.3)'}`,
            }} />
          ))}
        </div>

        {/* Center icon / skull */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <div className={`text-3xl mb-1`} style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            {room.cleared ? '✅' : room.locked ? '🔒' : diff.skull}
          </div>
          <div className="text-[10px] font-cinzel uppercase tracking-widest font-bold"
            style={{ color: room.cleared ? 'var(--color-success)' : room.locked ? '#5B616A' : diff.border, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
            {diff.label}
          </div>
        </div>

        {/* Door handle */}
        <div className="absolute right-6 top-1/2 w-4 h-4 rounded-full -translate-y-1/2 z-20"
          style={{ background: `linear-gradient(135deg,var(--color-gold),var(--color-bronze))`, boxShadow: `0 0 6px rgba(212,175,55,0.8)`, border: '1px solid #111' }} />

        {/* Cleared fog effect */}
        {room.cleared && (
          <div className="absolute inset-0 rounded-t-[50%] z-0" style={{ background: 'radial-gradient(circle at center,rgba(76,175,80,0.1) 0%,transparent 70%)' }} />
        )}
      </div>

      {/* Door base / step */}
      <div className="h-4 rounded-b bg-stone-texture iron-border" style={{
        boxShadow: room.cleared ? 'none' : room.locked ? 'none' : `0 4px 20px ${diff.glow}40`,
        marginTop: '-2px'
      }} />

      {/* Door label below */}
      <div className="mt-2 text-center px-1">
        <span className="block font-bold text-xs text-gray-200 truncate font-inter" title={room.title}>
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

// ─── Section Trap Door ──────────────────────────────────────────────────────────────
function SectionDoor({ title, subtitle, sectionNum, rooms, activeRoomId, onSelectRoom, isOpen, anyOpen, onToggle }) {

  const flexValue = !anyOpen ? '1' : (isOpen ? '6' : '1');

  return (
    <div
      onClick={!isOpen ? onToggle : undefined}
      className={`relative rounded-t-[100px] overflow-hidden bg-stone-texture transition-all duration-700 ease-in-out flex flex-col group ${isOpen ? 'cursor-default' : 'cursor-pointer hover:bg-stone-800'
        }`}
      style={{
        flex: flexValue,
        border: isOpen ? '2px solid var(--color-gold)' : '2px solid var(--color-stone-secondary)',
        minHeight: '450px',
        boxShadow: isOpen ? '0 0 30px rgba(212,175,55,0.1)' : 'inset 0 0 30px rgba(0,0,0,0.9)',
      }}
    >
      <Vines count={6} />

      {/* Closed State UI */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500 ${!isOpen ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'}`}>

        {/* Outer Door Wood Panels effect */}
        <div className="absolute inset-6 top-10 flex flex-col gap-3 opacity-40 z-0">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-1 rounded" style={{
              background: `rgba(139,107,63,0.15)`,
              border: `1px solid rgba(139,107,63,0.3)`,
            }} />
          ))}
        </div>

        <div className="z-10 flex flex-col items-center justify-center h-full w-full relative">
          <div className={`font-cinzel transition-all duration-700 ${!anyOpen ? 'text-8xl mb-8' : 'text-5xl absolute top-12'} text-stone-500 group-hover:text-amber-500`}
            style={{ textShadow: '0 4px 10px rgba(0,0,0,0.8)' }}>
            {sectionNum === 1 ? 'I' : sectionNum === 2 ? 'II' : 'III'}
          </div>

          <div
            className={`font-cinzel tracking-[0.3em] uppercase transition-all duration-700 text-stone-400 group-hover:text-amber-400 font-bold ${!anyOpen ? 'text-2xl text-center px-6' : 'text-xl absolute top-1/2 -translate-y-1/2 whitespace-nowrap'}`}
            style={{
              writingMode: !anyOpen ? 'horizontal-tb' : 'vertical-rl',
              transform: !anyOpen ? 'none' : 'rotate(180deg)',
              textShadow: '0 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            {title}
          </div>

          {!anyOpen && (
            <div className="absolute bottom-16 text-[11px] text-stone-500 font-mono tracking-widest uppercase animate-pulse">
              Click to Open Trapdoor
            </div>
          )}
        </div>
      </div>

      {/* Open State UI */}
      <div className={`absolute inset-0 p-6 md:p-8 flex flex-col transition-all duration-700 delay-200 ${isOpen ? 'opacity-100 pointer-events-auto z-20' : 'opacity-0 pointer-events-none z-0 translate-y-4'}`}>
        <div className="flex justify-between items-start mb-8 border-b border-stone-800 pb-4">
          <div>
            <h3 className="text-2xl md:text-3xl font-cinzel font-black tracking-wider text-white uppercase" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              {title}
            </h3>
            <p className="text-gray-400 font-inter italic mt-2 text-sm">{subtitle}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="w-10 h-10 shrink-0 rounded-full border border-stone-600 flex items-center justify-center text-stone-400 hover:text-white hover:border-white hover:bg-white/10 transition-colors bg-stone-900 shadow-lg"
            title="Close Trapdoor"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6 flex-grow overflow-hidden pr-2 pb-4 content-start">
          {rooms.map(room => (
            <DungeonDoor key={room.id} room={room} isActive={room.id === activeRoomId} isCurrent={room.id === activeRoomId} onClick={(e) => { e.stopPropagation(); onSelectRoom(room.id); }} />
          ))}
          {rooms.length === 0 && (
            <p className="text-center py-10 text-gray-600 font-mono text-sm col-span-full">This wing of the dungeon is empty or locked.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DungeonHall ──────────────────────────────────────────────────────────────
export default function DungeonHall({ rooms, activeRoomId, onSelectRoom }) {
  const [openSection, setOpenSection] = useState(null);

  if (!rooms.length) {
    return (
      <div className="flex items-center justify-center min-h-64 rounded-2xl" style={{ background: 'rgba(13,3,0,0.6)', border: '1px solid rgba(204,26,0,0.15)' }}>
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
  const progress = Math.round((clearedCount / rooms.length) * 100) || 0;

  const anyOpen = openSection !== null;

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Global Progress Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1 bg-stone-900/50 p-4 rounded-xl border border-stone-800">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-cinzel)', background: `linear-gradient(135deg,var(--color-gold),#FFF)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            The Dungeon Corridor
          </h2>
          <p className="text-xs text-gray-400 font-cinzel mt-1">
            {clearedCount} of {rooms.length} chambers cleared
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-gray-500 font-cinzel uppercase tracking-widest">Progress</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-24 md:w-32 h-2 rounded bg-stone-texture iron-border overflow-hidden">
              <div className="h-full transition-all duration-700"
                style={{ width: `${progress}%`, background: `linear-gradient(90deg,var(--color-bronze),var(--color-gold))`, boxShadow: `0 0 6px var(--color-gold)` }} />
            </div>
            <span className="text-xs font-bold font-inter text-gray-200 min-w-[2.5rem] text-right">{progress}%</span>
          </div>
        </div>
      </div>

      {/* ─── Three Trap Doors (Horizontal Layout) ───────────────────────── */}
      <div className="w-full overflow-x-auto custom-scrollbar pb-4">
        <div className="flex flex-row gap-4 min-w-[900px] h-[450px] p-2">
          <SectionDoor
            title="Chambers of Shuffled Sigils"
            subtitle="Rearrange code blocks to rebuild ancient spells & compile solutions"
            sectionNum={1}
            rooms={section1Rooms}
            activeRoomId={activeRoomId}
            onSelectRoom={onSelectRoom}
            isOpen={openSection === 1}
            anyOpen={anyOpen}
            onToggle={() => setOpenSection(openSection === 1 ? null : 1)}
          />

          <SectionDoor
            title="The Ancient Library"
            subtitle="Predict sequences and find patterns left behind by the arch-mages"
            sectionNum={2}
            rooms={section2Rooms}
            activeRoomId={activeRoomId}
            onSelectRoom={onSelectRoom}
            isOpen={openSection === 2}
            anyOpen={anyOpen}
            onToggle={() => setOpenSection(openSection === 2 ? null : 2)}
          />

          <SectionDoor
            title="The Final Gate"
            subtitle="Implement complex logic to defeat the Boss and escape the dungeon"
            sectionNum={3}
            rooms={section3Rooms}
            activeRoomId={activeRoomId}
            onSelectRoom={onSelectRoom}
            isOpen={openSection === 3}
            anyOpen={anyOpen}
            onToggle={() => setOpenSection(openSection === 3 ? null : 3)}
          />
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-[10px] text-gray-600 font-mono mt-2 uppercase tracking-widest">
        {anyOpen ? "Select a chamber to enter, or click the X to close the trapdoor" : "Click a trapdoor to reveal its chambers"}
      </p>
    </div>
  );
}
