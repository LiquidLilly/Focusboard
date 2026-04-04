import { useState } from 'react'
import useStore from '../../store/useStore'
import { callAIStream, REFLECT_SYSTEM_PROMPT } from '../../hooks/useAI'

export default function HardMomentTool({ onEntryCreated }) {
  const { addReflectEntry, updateReflectEntry } = useStore()
  const [text, setText]         = useState('')
  const [response, setResponse] = useState(null)
  const [streaming, setStreaming] = useState(false)
  const [entryId, setEntryId]   = useState(null)

  async function handleSubmit() {
    if (!text.trim() || streaming) return
    setStreaming(true)
    setResponse('')

    // Create the entry so it's saved even if streaming is interrupted
    const id = addReflectEntry({ type: 'hard-moment', userText: text, claudeResponse: '' })
    setEntryId(id)

    try {
      await callAIStream(
        text,
        (_, full) => {
          setResponse(full)
          updateReflectEntry(id, { claudeResponse: full })
        },
        REFLECT_SYSTEM_PROMPT,
        2048,
      )
    } catch (e) {
      const errorMsg = `Error: ${e.message}`
      setResponse(errorMsg)
      updateReflectEntry(id, { claudeResponse: errorMsg })
    } finally {
      setStreaming(false)
      if (onEntryCreated) onEntryCreated()
    }
  }

  const ready = text.trim() && !streaming && response === null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
        What happened?
      </p>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
        Write freely. This is private. No structure required.
      </p>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Something at work felt hard. Something was said. Something's been sitting with you..."
        rows={8}
        style={{
          width: '100%', resize: 'vertical',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border-default)',
          borderRadius: 10, padding: '14px 16px',
          fontSize: 14, lineHeight: 1.8,
          color: 'var(--text-primary)', outline: 'none',
          fontFamily: 'inherit',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--reflect-accent)' }}
        onBlur={e => { e.target.style.borderColor = 'var(--border-default)' }}
        disabled={response !== null}
      />

      {response === null && (
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || streaming}
          style={{
            alignSelf: 'flex-start',
            padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500,
            background: 'rgba(157,127,232,0.2)', color: 'var(--reflect-accent)',
            border: '1px solid rgba(157,127,232,0.35)',
            cursor: (!text.trim() || streaming) ? 'default' : 'pointer',
            opacity: !text.trim() ? 0.5 : 1,
            transition: 'opacity 150ms',
          }}
        >
          {streaming ? 'Thinking…' : 'Help me see this clearly'}
        </button>
      )}

      {/* Claude's response */}
      {response !== null && (
        <div style={{
          padding: '16px 20px',
          borderRadius: 10,
          background: 'rgba(157,127,232,0.08)',
          border: '1px solid rgba(157,127,232,0.2)',
          fontSize: 14, lineHeight: 1.8,
          color: 'var(--text-secondary)',
          whiteSpace: 'pre-wrap',
        }}>
          {response || '…'}
          {streaming && <span className="streaming-cursor" />}
        </div>
      )}

      {/* Start over */}
      {response !== null && !streaming && (
        <button
          onClick={() => { setText(''); setResponse(null); setEntryId(null) }}
          style={{ alignSelf: 'flex-start', fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Write another →
        </button>
      )}
    </div>
  )
}
