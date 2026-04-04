import { useState } from 'react'
import useStore from '../../store/useStore'

const PLACEHOLDER_INTENTIONS = [
  'Finish the APR trending draft',
  'Follow up on cleaning SOP revision',
  'Prep for the cross-functional review',
]

export default function MorningStartup() {
  const { completeMorningFlow, buckets, showToast } = useStore()

  const [step, setStep]           = useState(1) // 1, 2, 3
  const [selected, setSelected]   = useState([])
  const [customText, setCustomText] = useState('')
  const [howToShow, setHowToShow] = useState('')

  // Step 2: All tasks due today or overdue + capture from today
  const allTasks = buckets.flatMap(b => b.tasks.map(t => ({ ...t, bucketName: b.name })))
  const dueTasks = allTasks.filter(t => {
    if (t.status === 'done') return false
    if (!t.dueDate) return false
    return t.dueDate.slice(0, 10) <= new Date().toISOString().slice(0, 10)
  }).slice(0, 10)

  function toggleSelect(text) {
    if (selected.includes(text)) {
      setSelected(prev => prev.filter(t => t !== text))
    } else {
      if (selected.length >= 3) {
        showToast('3 is enough. Which 3 matter most?')
        return
      }
      setSelected(prev => [...prev, text])
    }
  }

  function handleFinish() {
    const intentions = [...selected]
    if (customText.trim() && intentions.length < 3) {
      intentions.push(customText.trim())
    }
    completeMorningFlow(intentions.slice(0, 3), howToShow)
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      maxWidth: 640, margin: '0 auto',
      padding: '40px 24px',
    }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: s === step ? 'var(--accent)' : s < step ? 'var(--accent-green)' : 'var(--border-default)',
            transition: 'background 300ms',
          }} />
        ))}
      </div>

      {/* Step 1 — Glance */}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
            Good morning, Wes.
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.7 }}>
            Take a moment to orient. Here's what's waiting for you today.
          </p>

          {dueTasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
              {dueTasks.map(task => (
                <div key={task.id} style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: task.dueDate < new Date().toISOString().slice(0, 10) ? 'var(--accent-red)' : 'var(--accent-warm)',
                  }} />
                  <span style={{ fontSize: 14, color: 'var(--text-primary)', flex: 1 }}>{task.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{task.bucketName}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px', borderRadius: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', marginBottom: 32, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Nothing overdue. Clean slate.</p>
            </div>
          )}

          <button onClick={() => setStep(2)} style={primaryBtn}>
            Start my day →
          </button>
        </div>
      )}

      {/* Step 2 — Pick your 3 */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
            What are your 3 for today?
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.7 }}>
            Pick up to 3 things that matter most. You can also type a new one.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {dueTasks.map(task => {
              const isSelected = selected.includes(task.title)
              return (
                <button
                  key={task.id}
                  onClick={() => toggleSelect(task.title)}
                  style={{
                    padding: '10px 16px', borderRadius: 10, textAlign: 'left',
                    background: isSelected ? 'rgba(91,156,246,0.1)' : 'var(--bg-surface)',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-subtle)'}`,
                    color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10, transition: 'all 150ms',
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border-default)'}`,
                    background: isSelected ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isSelected && <span style={{ color: 'var(--text-inverse)', fontSize: 11, fontWeight: 700 }}>✓</span>}
                  </div>
                  {task.title}
                </button>
              )
            })}
          </div>

          {/* Custom intention */}
          <input
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            placeholder="Or type something else..."
            style={{
              width: '100%', padding: '10px 14px', fontSize: 14,
              background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              borderRadius: 10, color: 'var(--text-primary)', outline: 'none',
              marginBottom: 4,
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--border-focus)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-default)' }}
          />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>
            {selected.length}/3 selected
          </p>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setStep(1)} style={ghostBtn}>← Back</button>
            <button
              onClick={() => setStep(3)}
              disabled={selected.length === 0 && !customText.trim()}
              style={{ ...primaryBtn, flex: 1, opacity: (selected.length === 0 && !customText.trim()) ? 0.5 : 1 }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — How do you want to show up */}
      {step === 3 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
            How do you want to show up today?
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.7 }}>
            Optional. One word or a short phrase.
          </p>

          <input
            autoFocus
            value={howToShow}
            onChange={e => setHowToShow(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleFinish() }}
            placeholder="Curious. Focused. Present."
            style={{
              width: '100%', padding: '14px 16px', fontSize: 16,
              background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              borderRadius: 12, color: 'var(--text-primary)', outline: 'none',
              marginBottom: 24,
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--border-focus)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-default)' }}
          />

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setStep(2)} style={ghostBtn}>← Back</button>
            <button onClick={handleFinish} style={{ ...primaryBtn, flex: 1 }}>
              Start →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const primaryBtn = {
  padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 500,
  background: 'var(--accent)', color: 'var(--text-inverse)', border: 'none',
  cursor: 'pointer', transition: 'opacity 150ms',
}

const ghostBtn = {
  padding: '12px 20px', borderRadius: 10, fontSize: 14,
  background: 'transparent', color: 'var(--text-secondary)',
  border: '1px solid var(--border-default)', cursor: 'pointer',
}
