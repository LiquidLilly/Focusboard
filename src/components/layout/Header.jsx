import { useState, useEffect, useRef } from 'react'
import { Settings, Target, RefreshCw } from 'lucide-react'
import useStore from '../../store/useStore'
import { REMINDERS } from '../../utils/reminders'

// Shuffle a copy of the array (Fisher-Yates)
function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Ambient reminder display ──────────────────────────────────────────────────
function AmbientReminder() {
  // Build a shuffled queue once on mount; when exhausted, reshuffle
  const queueRef  = useRef(shuffleArray(REMINDERS))
  const indexRef  = useRef(0)
  const timerRef  = useRef(null)

  const [visible, setVisible]   = useState(true)
  const [text, setText]         = useState(() => queueRef.current[0])

  function advanceTo(next) {
    // Fade out, swap text, fade in
    setVisible(false)
    setTimeout(() => {
      setText(next)
      setVisible(true)
    }, 300)
  }

  function nextReminder() {
    indexRef.current += 1
    if (indexRef.current >= queueRef.current.length) {
      queueRef.current = shuffleArray(REMINDERS)
      indexRef.current = 0
    }
    advanceTo(queueRef.current[indexRef.current])
  }

  // Auto-rotate every 4 minutes
  useEffect(() => {
    timerRef.current = setInterval(nextReminder, 240_000)
    return () => clearInterval(timerRef.current)
  }, [])

  function handleRefresh() {
    clearInterval(timerRef.current)
    nextReminder()
    timerRef.current = setInterval(nextReminder, 240_000)
  }

  return (
    // Fixed-height container prevents layout shift
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        height: 18, overflow: 'hidden',
      }}
    >
      <span
        style={{
          fontSize: 12, fontStyle: 'italic',
          color: 'var(--text-muted)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </span>
      <button
        onClick={handleRefresh}
        title="Next reminder"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: 0, lineHeight: 0,
          opacity: 0.6,
          flexShrink: 0,
        }}
      >
        <RefreshCw size={10} />
      </button>
    </div>
  )
}

// ── Header ─────────────────────────────────────────────────────────────────────
export default function Header() {
  const { setSettingsOpen, activeView, setActiveView } = useStore()

  return (
    <div
      className="shrink-0 flex items-center justify-between px-4"
      style={{ height: 48, background: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Target size={18} color="var(--accent-primary)" />
        <span style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: 15, letterSpacing: '0.02em' }}>
          FocusBoard
        </span>
      </div>

      {/* Nav tabs + ambient reminder */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <NavTab label="Board"     value="board"     active={activeView === 'board'}     onClick={() => setActiveView('board')} />
          <NavTab label="Tomorrow"  value="planner"   active={activeView === 'planner'}   onClick={() => setActiveView('planner')} />
          <NavTab label="Mindspace" value="mindspace" active={activeView === 'mindspace'} onClick={() => setActiveView('mindspace')} />
        </div>

        <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', flexShrink: 0 }} />

        <AmbientReminder />
      </div>

      {/* Settings */}
      <button
        onClick={() => setSettingsOpen(true)}
        style={{ color: 'var(--text-secondary)', padding: '6px', borderRadius: 8, background: 'transparent', border: 'none' }}
        className="hover:bg-bg-elevated transition-colors"
        title="Settings"
      >
        <Settings size={18} />
      </button>
    </div>
  )
}

function NavTab({ label, value, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 14px',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
        background: active ? 'rgba(72,185,199,0.12)' : 'transparent',
        border: active ? '1px solid rgba(72,185,199,0.3)' : '1px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}
