import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';

const MEDIEVAL_THEME_NAME = 'dungeonMedievalTheme';

function defineDungeonTheme(monaco) {
  monaco.editor.defineTheme(MEDIEVAL_THEME_NAME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'D4AF37', background: '0d1117' },
      { token: 'keyword', foreground: '8B6B3F', fontStyle: 'bold' },
      { token: 'number', foreground: 'D4AF37' },
      { token: 'string', foreground: 'E6C28F' },
      { token: 'comment', foreground: '5B616A', fontStyle: 'italic' },
      { token: 'type', foreground: '8B6B3F' },
      { token: 'delimiter', foreground: 'D4AF37' },
      { token: 'operator', foreground: '8B6B3F' },
      { token: 'identifier', foreground: 'E5E7EB' },
      { token: 'function', foreground: 'D4AF37' },
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#D4AF37',
      'editor.lineHighlightBackground': '#161b22',
      'editor.selectionBackground': '#8B6B3F44',
      'editor.inactiveSelectionBackground': '#8B6B3F22',
      'editorCursor.foreground': '#8B6B3F',
      'editorLineNumber.foreground': '#5B616A',
      'editorLineNumber.activeForeground': '#D4AF37',
      'editorGutter.background': '#0d1117',
      'editorBracketMatch.background': '#8B6B3F33',
      'editorBracketMatch.border': '#8B6B3F',
      'scrollbarSlider.background': '#5B616A33',
      'scrollbarSlider.hoverBackground': '#5B616A55',
      'scrollbarSlider.activeBackground': '#5B616A88',
    },
  });
}

const getDifficultyConfig = (diff) => {
  switch (diff) {
    case 'easy':
      return { color: 'var(--color-gold)', glow: 'rgba(212,175,55,0.4)', label: 'Novice', icon: '🗝️' };
    case 'medium':
      return { color: 'var(--color-bronze)', glow: 'rgba(139,107,63,0.4)', label: 'Cursed', icon: '🔥' };
    case 'hard':
      return { color: 'var(--color-error)', glow: 'rgba(139,30,30,0.5)', label: 'Infernal', icon: '⚠️' };
    case 'boss':
      return { color: 'var(--color-gold)', glow: 'rgba(212,175,55,0.6)', label: 'BOSS', icon: '☠️' };
    default:
      return { color: '#6b7280', glow: 'rgba(107,114,128,0.3)', label: diff, icon: '❓' };
  }
};

export default function ChallengePanel({
  room,
  code,
  onCodeChange,
  onSubmit,
  submitting,
  submitError,
  submission,
  onClose,
}) {
  const [themeReady, setThemeReady] = useState(false);
  const editorRef = useRef(null);
  
  const [showReward, setShowReward] = useState(false);
  const prevCleared = useRef(room?.cleared);

  useEffect(() => {
    if (room?.cleared && !prevCleared.current) {
      setShowReward(true);
      setTimeout(() => setShowReward(false), 3500);
    }
    prevCleared.current = room?.cleared;
  }, [room?.cleared]);

  // --- Rearrangement State & Refs ---
  const [rearrangeItems, setRearrangeItems] = useState([]);
  const dragItem = useRef();
  const dragOverItem = useRef();

  useEffect(() => {
    if (room && room.type === 'rearrangement') {
      try {
        const parsed = JSON.parse(code);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRearrangeItems(parsed);
          return;
        }
      } catch (e) {}
      setRearrangeItems(room.shuffled_order || []);
      onCodeChange(JSON.stringify(room.shuffled_order || []));
    }
  }, [room, code]);

  const updateRearrangeItems = (newItems) => {
    setRearrangeItems(newItems);
    onCodeChange(JSON.stringify(newItems));
  };

  const handleDragStart = (e, position) => {
    dragItem.current = position;
  };

  const handleDragEnter = (e, position) => {
    dragOverItem.current = position;
  };

  const handleDrop = () => {
    const copyListItems = [...rearrangeItems];
    const dragItemContent = copyListItems[dragItem.current];
    copyListItems.splice(dragItem.current, 1);
    copyListItems.splice(dragOverItem.current, 0, dragItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    updateRearrangeItems(copyListItems);
  };

  const moveItem = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= rearrangeItems.length) return;
    const copyListItems = [...rearrangeItems];
    const temp = copyListItems[index];
    copyListItems[index] = copyListItems[nextIndex];
    copyListItems[nextIndex] = temp;
    updateRearrangeItems(copyListItems);
  };

  const diffConf = getDifficultyConfig(room?.difficulty);
  const isCleared = room?.cleared;
  const isPending = submission?.status === 'pending';
  const isRejected = submission?.status === 'rejected';

  function handleEditorMount(editor, monaco) {
    editorRef.current = editor;
    defineDungeonTheme(monaco);
    monaco.editor.setTheme(MEDIEVAL_THEME_NAME);
    setThemeReady(true);

    editor.updateOptions({
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      autoIndent: 'full',
      formatOnType: true,
      minimap: { enabled: false },
      fontSize: 15,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      fontLigatures: true,
      lineHeight: 24,
      cursorBlinking: 'phase',
      cursorStyle: 'line-thin',
      scrollBeyondLastLine: false,
      renderLineHighlight: 'all',
      smoothScrolling: true,
      padding: { top: 16, bottom: 16 },
    });
  }

  if (!room) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0d1117] text-gray-200">
      
      {/* --- Reward Overlay --- */}
      {showReward && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <div className="relative flex flex-col items-center">
            <h1 
              className="text-6xl md:text-8xl font-black font-cinzel text-transparent bg-clip-text animate-level-up" 
              style={{ backgroundImage: 'linear-gradient(180deg, #FFE066 0%, #D4AF37 50%, #8B6B3F 100%)', filter: 'drop-shadow(0 10px 20px rgba(212,175,55,0.6))' }}
            >
              CHAMBER CLEARED!
            </h1>
            <div 
              className="mt-8 text-4xl font-bold text-green-400 font-mono animate-float-up" 
              style={{ textShadow: '0 0 15px rgba(76,175,80,0.8)' }}
            >
              +{room.points} XP
            </div>
          </div>
        </div>
      )}

      {/* --- Top Header Bar --- */}
      <div className="flex-none flex items-center justify-between px-6 py-3 border-b iron-border bg-stone-texture shadow-xl relative z-10">
        
        {/* Top Glow */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${diffConf.color}, var(--color-gold), ${diffConf.color}, transparent)`,
            boxShadow: `0 0 20px ${diffConf.glow}`,
          }}
        />

        <div className="flex items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-cinzel text-xs uppercase tracking-widest text-gray-400 font-bold">
                Chamber {room.room_order}
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                style={{
                  color: diffConf.color,
                  borderColor: diffConf.color,
                  background: 'rgba(0,0,0,0.5)',
                  boxShadow: `inset 0 0 8px ${diffConf.glow}`,
                }}
              >
                {diffConf.icon} {diffConf.label}
              </span>
            </div>
            <h2
              className="text-xl md:text-2xl font-black tracking-tight"
              style={{
                fontFamily: 'var(--font-cinzel)',
                background: `linear-gradient(135deg, #fff 0%, ${diffConf.color} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)'
              }}
            >
              {room.title}
            </h2>
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-xs text-gray-400 font-cinzel">{room.topic}</span>
            <span className="text-xs font-bold" style={{ color: 'var(--color-gold)' }}>+{room.points} XP</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="stone-btn px-4 py-2 text-sm flex items-center gap-2"
        >
          <span>⬅</span> Return to Hall
        </button>
      </div>

      {/* --- Main Workspace (Split Pane) --- */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-black">
        
        {/* LEFT PANE: Problem Statement & Status */}
        <div className="w-full lg:w-[40%] xl:w-[35%] flex flex-col border-r iron-border overflow-y-auto bg-stone-texture/50">
          <div className="p-6 flex flex-col gap-6">
            
            {/* Problem Statement Box */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 text-gray-400 font-cinzel">
                <span className="text-base">📜</span> Problem Statement
              </h3>
              <div
                className="rounded p-5 text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap bg-parchment border iron-border shadow-inner font-inter"
              >
                {room.problem_statement || (
                  <span className="text-gray-600 italic">
                    Problem statement will appear here once published.
                  </span>
                )}
              </div>
            </div>

            {/* Status Banners */}
            {isCleared ? (
              <div className="rounded p-5 border flex items-start gap-4 iron-border bg-stone-texture shadow-lg">
                <span className="text-3xl">✅</span>
                <div>
                  <p className="text-emerald-400 font-bold font-cinzel text-lg">Chamber Cleared!</p>
                  <p className="text-emerald-600/80 text-sm mt-1 leading-snug">
                    Your solution was verified and accepted. The next door has been unlocked!
                  </p>
                </div>
              </div>
            ) : isPending ? (
              <div className="rounded p-5 border flex items-start gap-4 iron-border bg-stone-texture shadow-lg">
                <span className="text-3xl animate-pulse">⏳</span>
                <div>
                  <p className="text-amber-400 font-bold font-cinzel text-lg">Submission Pending Review</p>
                  <p className="text-amber-600/80 text-sm mt-1 leading-snug">
                    Your code is currently being executed by the Dungeon Master. Please hold!
                  </p>
                </div>
              </div>
            ) : isRejected ? (
              <div className="rounded p-5 border flex items-start gap-4 iron-border bg-stone-texture shadow-lg">
                <span className="text-3xl">⚔️</span>
                <div className="flex-1">
                  <p className="text-red-500 font-bold font-cinzel text-lg mb-1">Submission Rejected</p>
                  <div className="bg-black/50 rounded p-3 text-sm text-red-400 font-mono overflow-x-auto border border-red-900/50">
                    {submission?.notes || 'Please review your logic and try again.'}
                  </div>
                </div>
              </div>
            ) : null}

          </div>
        </div>

        {/* RIGHT PANE: Workspace depending on challenge type */}
        <div className="w-full lg:w-[60%] xl:w-[65%] flex flex-col bg-[#0d1117]">
          
          {/* Workspace Header */}
          <div className="flex-none px-4 py-2 bg-stone-texture iron-border border-b flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm">🛠️</span>
              <span className="font-mono text-xs text-gray-400">
                {room.type === 'rearrangement' 
                  ? 'sigil_reorder.cpp' 
                  : room.type === 'pattern_manual'
                  ? 'pattern_prediction.txt'
                  : 'solution.cpp'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-500 bg-black/40 px-2 py-1 rounded">
              {room.type === 'rearrangement'
                ? 'Drag & Drop Sequence'
                : room.type === 'pattern_manual'
                ? 'Output Text Prediction'
                : 'C++ (g++)'}
            </span>
          </div>

          {/* Workspace Container */}
          <div className="flex-1 min-h-0 overflow-y-auto relative p-4">
            {room.type === 'rearrangement' ? (
              <div className="flex flex-col gap-2 max-w-2xl mx-auto py-4">
                <p className="text-xs text-gray-400 font-mono mb-2 uppercase tracking-wider">
                  💡 Drag & drop the strips of code to reorder, or use the arrow buttons:
                </p>
                {rearrangeItems.map((item, index) => (
                  <div
                    key={index}
                    draggable={!isCleared && !isPending}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragEnd={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className={`flex items-center justify-between p-3 rounded-lg border font-mono text-sm select-none transition-all ${
                      isCleared || isPending
                        ? 'border-gray-800 bg-gray-950/40 text-gray-500 cursor-not-allowed'
                        : 'border-amber-900/40 bg-stone-900/60 hover:bg-stone-800/80 hover:border-amber-500/50 text-amber-200/90 cursor-grab active:cursor-grabbing'
                    }`}
                    style={{
                      boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                    }}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-xs text-gray-600 font-bold shrink-0 w-4">
                        {index + 1}
                      </span>
                      <span className="whitespace-pre overflow-x-auto text-left">
                        {item}
                      </span>
                    </div>
                    
                    {!isCleared && !isPending && (
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          onClick={() => moveItem(index, -1)}
                          disabled={index === 0}
                          className="px-2 py-1 bg-black/40 hover:bg-black/80 text-xs rounded border border-gray-800 disabled:opacity-30 disabled:hover:bg-black/40"
                          title="Move Up"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveItem(index, 1)}
                          disabled={index === rearrangeItems.length - 1}
                          className="px-2 py-1 bg-black/40 hover:bg-black/80 text-xs rounded border border-gray-800 disabled:opacity-30 disabled:hover:bg-black/40"
                          title="Move Down"
                        >
                          ▼
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : room.type === 'pattern_manual' ? (
              <div className="max-w-2xl mx-auto py-6 flex flex-col gap-4">
                <label className="block text-xs font-mono uppercase tracking-wider text-amber-500/80">
                  Enter output prediction:
                </label>
                <textarea
                  value={code}
                  onChange={(e) => onCodeChange(e.target.value)}
                  disabled={isCleared || isPending}
                  placeholder="Type your predicted output pattern here..."
                  className="w-full h-64 p-4 rounded-xl font-mono text-sm leading-relaxed outline-none transition-all bg-black/60 text-emerald-400 border border-amber-900/30 focus:border-amber-500/50 shadow-inner disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            ) : (
              <Editor
                height="100%"
                language="cpp"
                value={code}
                onChange={(val) => onCodeChange(val || '')}
                onMount={handleEditorMount}
                theme={themeReady ? MEDIEVAL_THEME_NAME : 'vs-dark'}
                options={{
                  readOnly: isCleared || isPending,
                  minimap: { enabled: false },
                  fontSize: 15,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                  autoClosingBrackets: 'always',
                  autoClosingQuotes: 'always',
                  autoIndent: 'full',
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  padding: { top: 16, bottom: 16 },
                  cursorBlinking: 'phase',
                }}
                loading={
                  <div className="h-full bg-[#0d1117] flex items-center justify-center">
                    <div className="text-sm animate-pulse font-mono text-gray-500">
                      Summoning editor magic...
                    </div>
                  </div>
                }
              />
            )}
          </div>

          {/* Submit Footer */}
          {!isCleared && !isPending && (
            <div className="flex-none p-4 bg-stone-texture iron-border border-t flex justify-end items-center gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-10">
              {submitError && (
                <p className="text-sm text-red-400 font-mono flex-1 text-right">{submitError}</p>
              )}
              <button
                onClick={(e) => { e.preventDefault(); onSubmit(e); }}
                disabled={submitting}
                className="stone-btn px-8 py-3 text-sm md:text-base min-w-[200px]"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  '🔥 Submit Solution'
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
