import { useState } from 'react'
import { Plus, X, ArrowRight } from 'lucide-react'
import useStore from '../../store/useStore'
import { callAIStream, BASE_SYSTEM_PROMPT } from '../../hooks/useAI'

export default function PostMeetingCard({ event, onClose, onGoToReflect }) {
  const { today, updateMeetingNotes, addCaptureItem, showToast } = useStore()
  const notes = today.meetingNotes[event.id] || {}

  const [rawNotes, setRawNotes]   = useState(notes.rawNotes || '')
  const [committed, setCommitted] = useState(notes.committed || [])
  const [unclear, setUnclear]     = useState(notes.unclear   || [])
  const [feltLike, setFeltLike]   = useState(notes.feltLike  || null)
  const [newCommit, setNewCommit] = useState('')
  const [newUnclear, setNewUnclear] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted]   = useState(null)

  function save(updates) {
    updateMeetingNotes(event.id, updates)
  }

  function addListItem(list, setList, fieldName, text, setInput) {
    const t = text.trim()
    if (!t) return
    const updated = [...list, t]
    setList(updated)
    save({ [fieldName]: updated })
    setInput('')
  }

  function removeListItem(list, setList, fieldName, i) {
    const updated = list.filter((_, idx) => idx !== i)
    setList(updated)
    save({ [fieldName]: updated })
  }

  function handleFelt(val) {
    setFeltLike(val)
    save({ feltLike: val })
  }

  async function sendToClaude() {
    if (!rawNotes.trim() && !committed.length && !unclear.length) return
    setExtracting(true)
    setExtracted('')
    try {
      const prompt = `From this meeting, extract concrete action items I need to act on.\n\nRaw notes: ${rawNotes}\nWhat I committed to: ${committed.join(', ')}\nWhat I'm unclear on: ${unclear.join(', ')}\n\nList only the action items, one per line, starting with a verb.`
      await callAIStream(prompt, (_, full) => setExtracted(full), BASE_SYSTEM_PROMPT)
    } catch (e) {
      setExtracted(`Error: ${e.message}`)
    } finally {
      setExtracting(false)
    }
  }

  function addExtractedToCapture() {
    if (!extracted) return
    const lines = extracted.split('\n').filter(l => l.trim())
    lines.forEach(line => addCaptureItem(line.trim()))
    showToast(`${lines.length} items added to Capture`)
    setExtracted(null)
  }

  const title = event.subject || event.summary || 'Meeting'

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
      borderRadius: 12, padding: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Post-meeting notes</p>
          <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Raw notes */}
        <div>
          <label style={labelStyle}>Notes</label>
          <textarea
            value={rawNotes}
            onChange={e => setRawNotes(e.target.value)}
            onBlur={() => save({ rawNotes })}
            placeholder="What happened in this meeting?"
            rows={4}
            style={textareaStyle}
          />
        </div>

        {/* Committed */}
        <ListField
          label="What I committed to"
          items={committed}
          newValue={newCommit}
          setNewValue={setNewCommit}
          onAdd={() => addListItem(committed, setCommitted, 'committed', newCommit, setNewCommit)}
          onRemove={i => removeListItem(committed, setCommitted, 'committed', i)}
          placeholder="Add something you said you'd do..."
        />

        {/* Unclear */}
        <ListField
          label="What I'm unclear on"
          items={unclear}
          newValue={newUnclear}
          setNewValue={setNewUnclear}
          onAdd={() => addListItem(unclear, setUnclear, 'unclear', newUnclear, setNewUnclear)}
          onRemove={i => removeListItem(unclear, setUnclear, 'unclear', i)}
          placeholder="What do you still not understand?"
        />

        {/* How it felt */}
        <div>
          <label style={labelStyle}>How it felt</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Good', 'Okay', 'Hard'].map(label => {
              const val = label.toLowerCase()
              const active = feltLike === val
              const color = val === 'good' ? 'var(--accent-green)' : val === 'okay' ? 'var(--accent)' : 'var(--accent-red)'
              return (
                <button
                  key={val}
                  onClick={() => handleFelt(val)}
                  style={{
                    padding: '6px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                    background: active ? `rgba(${val === 'good' ? '76,175,130' : val === 'okay' ? '91,156,246' : '224,92,92'},0.15)` : 'var(--bg-raised)',
                    color: active ? color : 'var(--text-muted)',
                    border: `1px solid ${active ? color : 'var(--border-default)'}`,
                    transition: 'all 150ms',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
          {feltLike === 'hard' && (
            <button
              onClick={onGoToReflect}
              style={{ marginTop: 10, fontSize: 12, color: 'var(--accent-purple)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <ArrowRight size={12} /> Process this in Reflect
            </button>
          )}
        </div>

        {/* Send to Claude */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={sendToClaude}
            disabled={extracting}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: 'rgba(157,127,232,0.12)', color: 'var(--accent-purple)',
              border: '1px solid rgba(157,127,232,0.25)',
              cursor: extracting ? 'default' : 'pointer',
              opacity: extracting ? 0.7 : 1,
            }}
          >
            {extracting ? 'Extracting…' : 'Extract action items with Claude'}
          </button>
          {extracted !== null && (
            <>
              <div style={{ padding: '10px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.7, background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {extracted || '…'}
                {extracting && <span className="streaming-cursor" />}
              </div>
              {!extracting && extracted && (
                <button
                  onClick={addExtractedToCapture}
                  style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, background: 'var(--bg-raised)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  Add all to Capture →
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ListField({ label, items, newValue, setNewValue, onAdd, onRemove, placeholder }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--accent)', paddingTop: 2, flexShrink: 0 }}>·</span>
            <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1, lineHeight: 1.5 }}>{item}</span>
            <button onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
              <X size={12} />
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onAdd() }}
            placeholder={placeholder}
            style={{ flex: 1, padding: '6px 10px', fontSize: 13, background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', outline: 'none' }}
          />
          <button onClick={onAdd} style={{ padding: '6px 12px', background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <Plus size={13} />
          </button>
        </div>
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
