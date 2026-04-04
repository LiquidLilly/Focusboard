import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import useStore from '../../store/useStore'
import { callAIStream, BASE_SYSTEM_PROMPT } from '../../hooks/useAI'

export default function PreMeetingCard({ event, onClose }) {
  const { today, updateMeetingNotes } = useStore()
  const notes = today.meetingNotes[event.id] || {}

  const [prepared, setPrepared] = useState(notes.prepared || '')
  const [wantToSay, setWantToSay] = useState(notes.wantToSay || [])
  const [newItem, setNewItem] = useState('')
  const [clarityInput, setClarityInput] = useState('')
  const [clarityResult, setClarityResult] = useState(null)
  const [clarityStreaming, setClarityStreaming] = useState(false)

  function save(updates) {
    updateMeetingNotes(event.id, updates)
  }

  function addWantToSay() {
    const t = newItem.trim()
    if (!t) return
    const updated = [...wantToSay, t]
    setWantToSay(updated)
    save({ wantToSay: updated })
    setNewItem('')
  }

  function removeWantToSay(i) {
    const updated = wantToSay.filter((_, idx) => idx !== i)
    setWantToSay(updated)
    save({ wantToSay: updated })
  }

  async function runClarityCheck() {
    if (!clarityInput.trim()) return
    setClarityStreaming(true)
    setClarityResult('')
    try {
      await callAIStream(
        `For an upcoming meeting, I've been asked to: ${clarityInput}\n\nRespond with:\n1. "Here's what I think is expected of you" — brief, specific\n2. "Questions worth asking before you start" — 2-3 questions\n3. "What success probably looks like" — one sentence`,
        (_, full) => setClarityResult(full),
        BASE_SYSTEM_PROMPT,
      )
    } catch (e) {
      setClarityResult(`Error: ${e.message}`)
    } finally {
      setClarityStreaming(false)
    }
  }

  const start = new Date(event.start?.dateTime || event.start?.date || '')
  const h = start.getHours() % 12 || 12
  const m = String(start.getMinutes()).padStart(2, '0')
  const ampm = start.getHours() >= 12 ? 'pm' : 'am'

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
      borderRadius: 12, padding: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 4 }}>Pre-meeting prep · {h}:{m} {ampm}</p>
          <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
            {event.subject || event.summary || 'Meeting'}
          </h3>
          {event.attendees && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {(event.attendees || []).map(a => a.emailAddress?.name || a.email || a).slice(0, 5).join(', ')}
            </p>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* What I prepared */}
        <div>
          <label style={labelStyle}>What I prepared</label>
          <textarea
            value={prepared}
            onChange={e => setPrepared(e.target.value)}
            onBlur={() => save({ prepared })}
            placeholder="Notes, context, things you've reviewed..."
            rows={3}
            style={textareaStyle}
          />
        </div>

        {/* What I want to say or ask */}
        <div>
          <label style={labelStyle}>What I want to say or ask</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {wantToSay.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--accent)', flexShrink: 0 }}>·</span>
                <span style={{ fontSize: 14, color: 'var(--text-primary)', flex: 1, lineHeight: 1.5 }}>{item}</span>
                <button onClick={() => removeWantToSay(i)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
                  <X size={12} />
                </button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addWantToSay() }}
                placeholder="Add an item..."
                style={{ flex: 1, padding: '6px 10px', fontSize: 13, background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', outline: 'none' }}
              />
              <button onClick={addWantToSay} style={{ padding: '6px 12px', background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <Plus size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Clarity check */}
        <div>
          <label style={labelStyle}>Clarity check</label>
          <textarea
            value={clarityInput}
            onChange={e => setClarityInput(e.target.value)}
            placeholder="What have you been asked to do in this meeting?"
            rows={2}
            style={textareaStyle}
          />
          <button
            onClick={runClarityCheck}
            disabled={!clarityInput.trim() || clarityStreaming}
            style={{
              marginTop: 8, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              background: 'rgba(91,156,246,0.12)', color: 'var(--accent)',
              border: '1px solid rgba(91,156,246,0.25)',
              cursor: (!clarityInput.trim() || clarityStreaming) ? 'default' : 'pointer',
              opacity: !clarityInput.trim() ? 0.5 : 1,
            }}
          >
            {clarityStreaming ? 'Thinking…' : 'Check clarity'}
          </button>
          {clarityResult !== null && (
            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.7, background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
              {clarityResult || '…'}
              {clarityStreaming && <span className="streaming-cursor" />}
            </div>
          )}
        </div>

        {/* Grounding reminder */}
        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border-subtle)', paddingTop: 12, margin: 0 }}>
          Being challenged is not the same as being wrong. You prepared. That counts.
        </p>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 500,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--text-muted)', marginBottom: 8,
}

const textareaStyle = {
  width: '100%', resize: 'vertical',
  background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
  borderRadius: 8, padding: '10px 12px',
  fontSize: 13, lineHeight: 1.6,
  color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit',
}
