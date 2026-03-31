import { Settings, Target } from 'lucide-react'
import useStore from '../../store/useStore'

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

      {/* Nav tabs */}
      <div className="flex items-center gap-1">
        <NavTab label="Board" value="board" active={activeView === 'board'} onClick={() => setActiveView('board')} />
        <NavTab label="Tomorrow" value="planner" active={activeView === 'planner'} onClick={() => setActiveView('planner')} />
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
