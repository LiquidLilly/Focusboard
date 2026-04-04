import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import useStore from '../../store/useStore'
import useReminders from '../../hooks/useReminders'

const TABS = [
  { id: 'today',   label: 'Today'   },
  { id: 'capture', label: 'Capture' },
  { id: 'board',   label: 'Board'   },
  { id: 'reflect', label: 'Reflect' },
]

function LiveTime() {
  const [time, setTime] = useState('')

  useEffect(() => {
    function tick() {
      const d = new Date()
      const h = d.getHours() % 12 || 12
      const m = String(d.getMinutes()).padStart(2, '0')
      const ampm = d.getHours() >= 12 ? 'pm' : 'am'
      setTime(`${h}:${m} ${ampm}`)
    }
    tick()
    const t = setInterval(tick, 10000)
    return () => clearInterval(t)
  }, [])

  return (
    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
      {time}
    </span>
  )
}

export default function Header() {
  const { activeView, setActiveView, setSettingsOpen } = useStore()
  const { text: reminder, visible } = useReminders()

  return (
    <header style={{
      height: 48, flexShrink: 0,
      display: 'flex', alignItems: 'center',
      padding: '0 20px',
      background: 'var(--bg-base)',
      borderBottom: '1px solid var(--border-subtle)',
      userSelect: 'none',
    }}>
      {/* Logo */}
      <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--accent)', letterSpacing: '-0.01em', marginRight: 32, flexShrink: 0 }}>
        FocusBoard
      </span>

      {/* Nav tabs */}
      <nav style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
        {TABS.map(tab => {
          const active = activeView === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              style={{
                background: active ? 'var(--bg-surface)' : 'transparent',
                border: active ? '1px solid var(--border-subtle)' : '1px solid transparent',
                borderRadius: 8,
                padding: '4px 14px',
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'color 150ms',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Ambient reminder */}
      <span
        key={reminder}
        className="reminder-fade"
        style={{
          fontSize: 12,
          fontStyle: 'italic',
          color: 'var(--text-muted)',
          marginRight: 16,
          maxWidth: 260,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          opacity: visible ? 1 : 0,
          transition: 'opacity 300ms',
          flexShrink: 1,
        }}
      >
        {reminder}
      </span>

      {/* Separator */}
      <div style={{ width: 1, height: 16, background: 'var(--border-default)', marginRight: 16, flexShrink: 0 }} />

      {/* Live time */}
      <LiveTime />

      {/* Settings */}
      <button
        onClick={() => setSettingsOpen(true)}
        style={{
          background: 'transparent', border: 'none',
          color: 'var(--text-muted)', marginLeft: 14, flexShrink: 0,
          padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center',
          transition: 'color 150ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
        title="Settings"
      >
        <Settings size={16} />
      </button>
    </header>
  )
}
