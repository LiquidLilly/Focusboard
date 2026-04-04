import { useState } from 'react'
import { callAIStream, BASE_SYSTEM_PROMPT } from '../../hooks/useAI'
import useStore from '../../store/useStore'

const CLARITY_PROMPT = (input) =>
  `I've been asked to do the following:\n\n${input}\n\nRespond with:\n1. "Here's what I think is being asked of you" — brief, specific\n2. "Questions worth asking before you go further" — 2-3 questions\n3. "What success probably looks like" — one sentence`

export default function ClarityCheckTool() {
  const { addReflectEntry, updateReflectEntry } = useStore()
  const [input, setInput]       = useState('')
  const [result, setResult]     = useState(null)
  const [streaming, setStreaming] = useState(false)

  async function runCheck() {
    if (!input.trim() || streaming) return
    setStreaming(true)
    setResult('')

    const id = addReflectEntry({ type: 'clarity-check', userText: input, claudeResponse: '' })

    try {
      await callAIStream(
        CLARITY_PROMPT(input),
        (_, full) => {
          setResult(full)
          updateReflectEntry(id, { claudeResponse: full })
        },
        BASE_SYSTEM_PROMPT,
      )
    } catch (e) {
      setResult(`Error: ${e.message}`)
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <p style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)', margin: 0, marginBottom: 8 }}>
          Clarity Check
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
          Before you start something hard — check that you understand what's actually being asked of you.
        </p>
      </div>

      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Paste or describe what you've been asked to do..."
        rows={5}
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
        disabled={result !== null}
      />

      {result === null && (
        <button
          onClick={runCheck}
          disabled={!input.trim() || streaming}
          style={{
            alignSelf: 'flex-start',
            padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500,
            background: 'rgba(91,156,246,0.12)', color: 'var(--accent)',
            border: '1px solid rgba(91,156,246,0.25)',
            cursor: (!input.trim() || streaming) ? 'default' : 'pointer',
            opacity: !input.trim() ? 0.5 : 1,
          }}
        >
          {streaming ? 'Checking…' : 'Check clarity'}
        </button>
      )}

      {result !== null && (
        <div style={{
          padding: '16px 20px', borderRadius: 10,
          background: 'rgba(91,156,246,0.06)',
          border: '1px solid rgba(91,156,246,0.2)',
          fontSize: 14, lineHeight: 1.8,
          color: 'var(--text-secondary)', whiteSpace: 'pre-wrap',
        }}>
          {result || '…'}
          {streaming && <span className="streaming-cursor" />}
        </div>
      )}

      {result !== null && !streaming && (
        <button
          onClick={() => { setInput(''); setResult(null) }}
          style={{ alignSelf: 'flex-start', fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Check something else →
        </button>
      )}
    </div>
  )
}
