import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';

const NEON_THEME_NAME = 'dungeonHorrorTheme';

const R='#CC1A00'; const RB='#FF3333'; const G='#F5A623'; const GB='#FFD700';

function defineDungeonTheme(monaco) {
  monaco.editor.defineTheme(NEON_THEME_NAME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'F5A623', background: '0d0300' },
      { token: 'keyword', foreground: 'FF3333', fontStyle: 'bold' },
      { token: 'number', foreground: 'FFD700' },
      { token: 'string', foreground: 'FFCC00' },
      { token: 'comment', foreground: '6b4b45', fontStyle: 'italic' },
      { token: 'type', foreground: 'FF3333' },
      { token: 'delimiter', foreground: 'F5A623' },
      { token: 'operator', foreground: 'FF3333' },
      { token: 'identifier', foreground: 'E5E7EB' },
      { token: 'function', foreground: 'FFD700' },
    ],
    colors: {
      'editor.background': '#0d0300',
      'editor.foreground': '#F5A623',
      'editor.lineHighlightBackground': '#250800',
      'editor.selectionBackground': '#CC1A0044',
      'editor.inactiveSelectionBackground': '#CC1A0022',
      'editorCursor.foreground': '#FF3333',
      'editorLineNumber.foreground': '#6b2010',
      'editorLineNumber.activeForeground': '#FFD700',
      'editorGutter.background': '#0d0300',
      'editorBracketMatch.background': '#CC1A0033',
      'editorBracketMatch.border': '#FF3333',
      'scrollbarSlider.background': '#CC1A0033',
      'scrollbarSlider.hoverBackground': '#CC1A0055',
      'scrollbarSlider.activeBackground': '#CC1A0088',
    },
  });
}

const getDifficultyConfig = (diff) => {
  switch (diff) {
    case 'easy':
      return { color: G, glow: 'rgba(245,166,35,0.4)', label: 'Novice', icon: '🗝️' };
    case 'medium':
      return { color: R, glow: 'rgba(204,26,0,0.4)', label: 'Cursed', icon: '🔥' };
    case 'hard':
      return { color: RB, glow: 'rgba(255,51,51,0.5)', label: 'Infernal', icon: '⚠️' };
    case 'boss':
      return { color: GB, glow: 'rgba(255,215,0,0.6)', label: 'BOSS', icon: '☠️' };
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
    monaco.editor.setTheme(NEON_THEME_NAME);
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
        className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border flex flex-col"
        style={{
          background: 'linear-gradient(135deg, #0d0300 0%, #1a0600 50%, #0d0300 100%)',
          borderColor: 'rgba(204,26,0,0.3)',
          boxShadow: '0 0 60px rgba(204,26,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow Bar */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
          style={{
            background: `linear-gradient(90deg, transparent, ${diffConf.color}, ${GB}, ${diffConf.color}, transparent)`,
            boxShadow: `0 0 20px ${diffConf.glow}`,
          }}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 pb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs uppercase tracking-widest" style={{ color: G }}>
                Chamber {room.room_order}
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                style={{
                  color: diffConf.color,
                  borderColor: diffConf.color + '60',
                  background: diffConf.color + '15',
                  boxShadow: `0 0 8px ${diffConf.glow}`,
                }}
              >
                {diffConf.icon} {diffConf.label}
              </span>
            </div>
            <h2
              className="text-2xl md:text-3xl font-black tracking-tight"
              style={{
                fontFamily: 'Cinzel, serif',
                background: `linear-gradient(135deg, #fff 0%, ${diffConf.color} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {room.title}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-gray-500 font-mono">{room.topic}</span>
              <span className="text-xs font-bold" style={{ color: GB }}>+{room.points} XP</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border text-gray-500 hover:text-white transition-all duration-200 text-lg font-bold"
            style={{ borderColor: 'rgba(204,26,0,0.3)', background: 'rgba(204,26,0,0.05)' }}
          >
            ×
          </button>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(204,26,0,0.2), transparent)' }} />

        {/* Content */}
        <div className="flex flex-col gap-5 p-6">
          {/* Problem Statement */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: G + 'cc' }}>
              <span className="text-base animate-skull">📜</span> Problem Statement
            </h3>
            <div
              className="rounded-xl p-5 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap border"
              style={{
                background: 'rgba(0,0,0,0.5)',
                borderColor: 'rgba(204,26,0,0.15)',
              }}
            >
              {room.problem_statement || (
                <span className="text-gray-600 italic font-mono">
                  Problem statement will appear here once the organizer publishes it.
                </span>
              )}
            </div>
          </div>

          {/* Submission Area */}
          {isCleared ? (
            /* CLEARED */
            <div
              className="rounded-xl p-5 border flex items-start gap-4"
              style={{
                background: 'rgba(16,185,129,0.05)',
                borderColor: 'rgba(16,185,129,0.3)',
              }}
            >
              <span className="text-3xl">✅</span>
              <div>
                <p className="text-emerald-400 font-bold">Chamber Cleared!</p>
                <p className="text-emerald-600/80 text-sm mt-0.5">
                  Your submission was accepted. Well done, adventurer!
                </p>
              </div>
            </div>
          ) : isPending ? (
            /* PENDING */
            <div
              className="rounded-xl p-5 border flex items-start gap-4 animate-pulse"
              style={{
                background: 'rgba(245,166,35,0.05)',
                borderColor: 'rgba(245,166,35,0.3)',
              }}
            >
              <span className="text-3xl animate-skull">⏳</span>
              <div>
                <p className="text-amber-400 font-bold">Submission Pending Review</p>
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
                  className="rounded-xl p-4 border text-sm"
                  style={{
                    background: 'rgba(204,26,0,0.05)',
                    borderColor: 'rgba(204,26,0,0.3)',
                  }}
                >
                  <div className="flex items-center gap-2 font-bold mb-1" style={{ color: RB }}>
                    <span className="animate-skull">💀</span> Submission Rejected
                  </div>
                  <p className="text-red-500/80">
                    {submission?.notes || 'Please review your logic and try again.'}
                  </p>
                </div>
              )}

              {/* Monaco Editor */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: G + 'cc' }}>
                  <span className="text-base">⚙️</span> Your Solution
                </h3>

                {/* Editor toolbar */}
                <div
                  className="flex items-center justify-between px-4 py-2.5 rounded-t-xl border border-b-0"
                  style={{
                    background: '#0d0300',
                    borderColor: 'rgba(204,26,0,0.2)',
                  }}
                >
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ background: R, boxShadow: `0 0 6px ${R}` }}
                    />
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ background: G, boxShadow: `0 0 6px ${G}` }}
                    />
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ background: GB, boxShadow: `0 0 6px ${GB}` }}
                    />
                    <span className="ml-2 font-mono text-gray-400">solution.cpp</span>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: G }}>C++ (g++)</span>
                </div>

                {/* Monaco */}
                <div
                  className="rounded-b-xl overflow-hidden border"
                  style={{ borderColor: 'rgba(204,26,0,0.2)' }}
                >
                  <Editor
                    height="360px"
                    language="cpp"
                    value={code}
                    onChange={(val) => onCodeChange(val || '')}
                    onMount={handleEditorMount}
                    theme={themeReady ? NEON_THEME_NAME : 'vs-dark'}
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
                      <div className="h-[360px] bg-[#0d0300] flex items-center justify-center">
                        <div className="text-sm animate-pulse font-mono" style={{ color: G }}>
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
                className="relative group overflow-hidden px-8 py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: submitting
                    ? 'rgba(204,26,0,0.3)'
                    : `linear-gradient(135deg, ${R}, ${G})`,
                  boxShadow: submitting ? 'none' : `0 0 24px rgba(204,26,0,0.4)`,
                  color: '#fff',
                }}
              >
                {/* Shimmer */}
                {!submitting && (
                  <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                )}
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
