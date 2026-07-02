import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';

const MEDIEVAL_THEME_NAME = 'dungeonMedievalTheme';

function defineDungeonTheme(monaco) {
  monaco.editor.defineTheme(MEDIEVAL_THEME_NAME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'D4AF37', background: '1B1F24' },
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
      'editor.background': '#1B1F24',
      'editor.foreground': '#D4AF37',
      'editor.lineHighlightBackground': '#2C2F33',
      'editor.selectionBackground': '#8B6B3F44',
      'editor.inactiveSelectionBackground': '#8B6B3F22',
      'editorCursor.foreground': '#8B6B3F',
      'editorLineNumber.foreground': '#5B616A',
      'editorLineNumber.activeForeground': '#D4AF37',
      'editorGutter.background': '#1B1F24',
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
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      fontLigatures: true,
      lineHeight: 22,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded border flex flex-col bg-stone-texture iron-border"
        style={{
          boxShadow: '0 0 60px rgba(0,0,0,0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow Bar */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${diffConf.color}, var(--color-gold), ${diffConf.color}, transparent)`,
            boxShadow: `0 0 20px ${diffConf.glow}`,
          }}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 pb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-cinzel text-xs uppercase tracking-widest text-gray-400 font-bold">
                Chamber {room.room_order}
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                style={{
                  color: diffConf.color,
                  borderColor: diffConf.color,
                  background: 'var(--color-stone-primary)',
                  boxShadow: `inset 0 0 8px ${diffConf.glow}`,
                }}
              >
                {diffConf.icon} {diffConf.label}
              </span>
            </div>
            <h2
              className="text-2xl md:text-3xl font-black tracking-tight"
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
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-gray-400 font-cinzel">{room.topic}</span>
              <span className="text-xs font-bold" style={{ color: 'var(--color-gold)' }}>+{room.points} XP</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded border text-gray-400 hover:text-white transition-all duration-200 text-lg font-bold"
            style={{ borderColor: 'var(--color-iron)', background: 'var(--color-stone-primary)' }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-5 p-6 border-t" style={{borderColor: 'var(--color-iron)'}}>
          {/* Problem Statement */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 text-gray-400 font-cinzel">
              <span className="text-base">📜</span> Problem Statement
            </h3>
            <div
              className="rounded p-5 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap bg-parchment"
            >
              {room.problem_statement || (
                <span className="text-gray-600 italic font-inter">
                  Problem statement will appear here once the organizer publishes it.
                </span>
              )}
            </div>
          </div>

          {/* Submission Area */}
          {isCleared ? (
            /* CLEARED */
            <div
              className="rounded p-5 border flex items-start gap-4 iron-border bg-stone-texture"
            >
              <span className="text-3xl">✅</span>
              <div>
                <p className="text-emerald-400 font-bold font-cinzel">Chamber Cleared!</p>
                <p className="text-emerald-600/80 text-sm mt-0.5">
                  Your submission was accepted. Well done, adventurer!
                </p>
              </div>
            </div>
          ) : isPending ? (
            /* PENDING */
            <div
              className="rounded p-5 border flex items-start gap-4 iron-border bg-stone-texture"
            >
              <span className="text-3xl animate-pulse">⏳</span>
              <div>
                <p className="text-amber-400 font-bold font-cinzel">Submission Pending Review</p>
                <p className="text-amber-600/80 text-sm mt-0.5">
                  A judge is currently verifying your output. Hang tight!
                </p>
              </div>
            </div>
          ) : (
            /* EDITOR + SUBMIT */
            <form
              onSubmit={onSubmit}
              className="flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Rejection Banner */}
              {isRejected && (
                <div
                  className="rounded p-4 border text-sm iron-border bg-stone-texture"
                >
                  <div className="flex items-center gap-2 font-bold mb-1" style={{ color: 'var(--color-error)' }}>
                    <span className="">⚔️</span> Submission Rejected
                  </div>
                  <p className="text-red-500/80">
                    {submission?.notes || 'Please review your logic and try again.'}
                  </p>
                </div>
              )}

              {/* Monaco Editor */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 text-gray-400 font-cinzel">
                  <span className="text-base">⚙️</span> Your Solution
                </h3>

                {/* Editor toolbar */}
                <div
                  className="flex items-center justify-between px-4 py-2.5 rounded-t border border-b-0"
                  style={{
                    background: 'var(--color-stone-secondary)',
                    borderColor: 'var(--color-iron)',
                  }}
                >
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="ml-2 font-mono text-gray-400">solution.cpp</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">C++ (g++)</span>
                </div>

                {/* Monaco */}
                <div
                  className="rounded-b overflow-hidden border"
                  style={{ borderColor: 'var(--color-iron)' }}
                >
                  <Editor
                    height="360px"
                    language="cpp"
                    value={code}
                    onChange={(val) => onCodeChange(val || '')}
                    onMount={handleEditorMount}
                    theme={themeReady ? MEDIEVAL_THEME_NAME : 'vs-dark'}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
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
                      <div className="h-[360px] bg-stone-texture flex items-center justify-center">
                        <div className="text-sm animate-pulse font-mono text-gray-400">
                          Loading editor...
                        </div>
                      </div>
                    }
                  />
                </div>
              </div>

              {submitError && (
                <p className="text-sm text-red-400 font-mono">{submitError}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="stone-btn px-8 py-3.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  '🔥 Submit for Verification'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
