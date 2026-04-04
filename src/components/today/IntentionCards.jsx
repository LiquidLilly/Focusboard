import { useState } from 'react'
import useStore from '../../store/useStore'

export default function IntentionCards() {
  const { today, toggleIntention } = useStore()
  const { intentions, howIWantToShowUp } = today

  const [completingIds, setCompletingIds] = useState(new Set())

  function handleCheck(id) {
    if (completingIds.has(id)) return
    setCompletingIds(prev => new Set([...prev, id]))
    setTimeout(() => {
      toggleIntention(id)
      setCompletingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 200)
  }

  const allDone = intentions.length > 0 && intentions.every(i => i.done)

  return (
    <div>
      {/* How I want to show up */}
      {howIWantToShowUp && (
        <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: 16, textAlign: 'center' }}>
          "{howIWantToShowUp}"
        </p>
      )}

      {/* Celebration */}
      {allDone && (
        <div style={{ textAlign: 'center', padding: '12px 0', marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--accent-green)', fontWeight: 500 }}>
            You did what you set out to do today.
          </p>
        </div>
      )}

      {/* Intention cards */}
      <div style={{ display: 'flex', gap: 12 }}>
        {intentions.map(intention => (
          <div
            key={intention.id}
            className={completingIds.has(intention.id) ? 'completing' : ''}
            style={{
              flex: 1,
              padding: '20px 20px',
              borderRadius: 12,
              background: intention.done ? 'var(--bg-surface)' : 'var(--bg-raised)',
              border: `1px solid ${intention.done ? 'var(--border-subtle)' : 'var(--border-default)'}`,
              opacity: intention.done ? 0.5 : 1,
              transition: 'opacity 300ms',
              display: 'flex', flexDirection: 'column', gap: 12,
              minHeight: 100,
            }}
          >
            <p style={{
              fontSize: 15, lineHeight: 1.5,
              color: intention.done ? 'var(--text-muted)' : 'var(--text-primary)',
              textDecoration: intention.done ? 'line-through' : 'none',
              flex: 1,
              margin: 0,
            }}>
              {intention.text}
            </p>

            {/* Checkbox */}
            <button
              onClick={() => handleCheck(intention.id)}
              disabled={intention.done}
              style={{
                width: 24, height: 24, borderRadius: 6,
                border: `2px solid ${intention.done ? 'var(--accent-green)' : 'var(--border-default)'}`,
                background: intention.done ? 'var(--accent-green)' : 'transparent',
                cursor: intention.done ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, alignSelf: 'flex-end',
                transition: 'all 200ms',
              }}
            >
              {intention.done && (
                <span style={{ color: 'var(--text-inverse)', fontSize: 14, fontWeight: 700, lineHeight: 1 }}>✓</span>
              )}
            </button>
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 3 - intentions.length) }).map((_, i) => (
          <div key={`empty-${i}`} style={{
            flex: 1, minHeight: 100,
            padding: '20px', borderRadius: 12,
            border: '1px dashed var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
          </div>
        ))}
      </div>
    </div>
  )
}
