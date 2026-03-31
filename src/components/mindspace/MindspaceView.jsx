import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp, RefreshCw, Send } from 'lucide-react'
import { DBT_TECHNIQUES } from '../../utils/dbtTechniques'
import { loadMindspaceCheckins, saveMindspaceCheckins } from '../../utils/storage'
import { callClaudeStream, getApiKey, MINDSPACE_SYSTEM_PROMPT } from '../../hooks/useAI'

// Today's date key
function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

// ── ScaleInput — five circles, 1–5 ──────────────────────────────────────────
function ScaleInput({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 8 }}>1</span>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            border: value === n ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
            background: value === n ? 'rgba(72,185,199,0.18)' : 'var(--bg-elevated)',
            cursor: 'pointer',
            transition: 'all 0.15s',
            outline: 'none',
          }}
          aria-label={`${n}`}
        />
      ))}
      <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 8 }}>5</span>
    </div>
  )
}

// ── Section wrapper — calm styling ───────────────────────────────────────────
function Section({ children, style = {} }) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 14,
        padding: 32,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h2
      style={{
        fontSize: 15,
        fontWeight: 400,
        color: 'var(--text-secondary)',
        marginBottom: 24,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </h2>
  )
}

// ── DBT Card ─────────────────────────────────────────────────────────────────
function DBTCard({ technique }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', textAlign: 'left', padding: '16px 18px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
            {technique.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {technique.tagline}
          </div>
        </div>
        <div style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {open && (
        <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: 4 }} />
          {technique.content.map((item, i) => (
            <div key={i}>
              {item.label && (
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-primary)', marginBottom: 3 }}>
                  {item.label}
                </div>
              )}
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {item.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Section 1: Daily Check-In ─────────────────────────────────────────────────
function CheckInSection({ checkin, onSaved }) {
  const [anxiety, setAnxiety]       = useState(checkin?.anxiety     || null)
  const [focus, setFocus]           = useState(checkin?.focus       || null)
  const [selfFeel, setSelfFeel]     = useState(checkin?.selfFeeling || null)
  const [freeText, setFreeText]     = useState(checkin?.freeText    || '')
  const [saved, setSaved]           = useState(!!checkin?.savedAt)

  function handleSave() {
    const all = loadMindspaceCheckins()
    const key = todayKey()
    all[key] = {
      ...(all[key] || {}),
      date: key,
      anxiety,
      focus,
      selfFeeling: selfFeel,
      freeText,
      savedAt: new Date().toISOString(),
    }
    saveMindspaceCheckins(all)
    setSaved(true)
    onSaved(all[key])
  }

  if (saved) {
    return (
      <Section>
        <SectionTitle>Daily Check-In</SectionTitle>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
          Saved. You showed up today.
        </p>
        <button
          onClick={() => setSaved(false)}
          style={{
            marginTop: 16, fontSize: 12, color: 'var(--text-muted)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          Edit check-in
        </button>
      </Section>
    )
  }

  return (
    <Section>
      <SectionTitle>Daily Check-In</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 10 }}>
            How is my anxiety right now?
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
            1 = calm &nbsp;·&nbsp; 5 = overwhelmed
          </div>
          <ScaleInput value={anxiety} onChange={setAnxiety} />
        </div>

        <div>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 10 }}>
            How is my focus right now?
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
            1 = scattered &nbsp;·&nbsp; 5 = locked in
          </div>
          <ScaleInput value={focus} onChange={setFocus} />
        </div>

        <div>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 10 }}>
            How am I feeling about myself today?
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
            1 = rough &nbsp;·&nbsp; 5 = solid
          </div>
          <ScaleInput value={selfFeel} onChange={setSelfFeel} />
        </div>

        <div>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 10 }}>
            Anything on your mind? <span style={{ color: 'var(--text-muted)' }}>(just for you)</span>
          </div>
          <textarea
            value={freeText}
            onChange={e => setFreeText(e.target.value)}
            placeholder="Optional…"
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: '10px 12px',
              fontSize: 13, color: 'var(--text-primary)',
              resize: 'vertical', outline: 'none',
              fontFamily: 'inherit', lineHeight: 1.5,
            }}
          />
        </div>

        <button
          onClick={handleSave}
          style={{
            alignSelf: 'flex-start',
            padding: '8px 20px', borderRadius: 8,
            background: 'rgba(72,185,199,0.12)',
            border: '1px solid rgba(72,185,199,0.3)',
            color: 'var(--accent-primary)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Save check-in
        </button>
      </div>
    </Section>
  )
}

// ── Section 2: DBT Toolkit ────────────────────────────────────────────────────
function DBTSection() {
  return (
    <Section>
      <SectionTitle>DBT Toolkit</SectionTitle>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 12,
        }}
      >
        {DBT_TECHNIQUES.map(t => (
          <DBTCard key={t.id} technique={t} />
        ))}
      </div>
    </Section>
  )
}

// ── Section 3: Today's Intention ──────────────────────────────────────────────
function IntentionSection({ savedIntention, onSaved }) {
  const [text, setText]       = useState(savedIntention || '')
  const [editing, setEditing] = useState(!savedIntention)

  function handleSave() {
    if (!text.trim()) return
    const all = loadMindspaceCheckins()
    const key = todayKey()
    all[key] = { ...(all[key] || {}), date: key, intention: text.trim() }
    saveMindspaceCheckins(all)
    setEditing(false)
    onSaved(text.trim())
  }

  return (
    <Section>
      <SectionTitle>Today's Intention</SectionTitle>

      {!editing && savedIntention ? (
        <div>
          <p style={{ fontSize: 15, color: 'var(--text-primary)', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
            "{savedIntention}"
          </p>
          <button
            onClick={() => setEditing(true)}
            style={{
              marginTop: 14, fontSize: 12, color: 'var(--text-muted)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            Change intention
          </button>
        </div>
      ) : (
        <div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="What is one thing I want to bring to today?"
            rows={2}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave() } }}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: '10px 12px',
              fontSize: 14, color: 'var(--text-primary)',
              resize: 'none', outline: 'none',
              fontFamily: 'inherit', lineHeight: 1.5,
            }}
          />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, marginBottom: 14 }}>
            Not a task — how do you want to show up today?
          </p>
          <button
            onClick={handleSave}
            disabled={!text.trim()}
            style={{
              padding: '8px 20px', borderRadius: 8,
              background: text.trim() ? 'rgba(72,185,199,0.12)' : 'transparent',
              border: `1px solid ${text.trim() ? 'rgba(72,185,199,0.3)' : 'var(--border-subtle)'}`,
              color: text.trim() ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontSize: 13, fontWeight: 500, cursor: text.trim() ? 'pointer' : 'default',
              transition: 'all 0.15s',
            }}
          >
            Set intention
          </button>
        </div>
      )}
    </Section>
  )
}

// ── Section 4: Ask Claude ─────────────────────────────────────────────────────
function AskClaudeSection() {
  const [input, setInput]       = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const responseRef             = useRef(null)

  async function handleSubmit() {
    if (!input.trim() || loading) return
    const apiKey = getApiKey()
    if (!apiKey) {
      setError('No API key set — add one in Settings.')
      return
    }
    setLoading(true)
    setResponse('')
    setError(null)
    try {
      await callClaudeStream(
        input.trim(),
        (_chunk, full) => {
          setResponse(full)
          // Scroll to bottom of response as it streams
          if (responseRef.current) {
            responseRef.current.scrollTop = responseRef.current.scrollHeight
          }
        },
        MINDSPACE_SYSTEM_PROMPT,
        1024,
      )
    } catch (e) {
      setError(e.message === 'NO_API_KEY' ? 'No API key set — add one in Settings.' : e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Section>
      <SectionTitle>Ask Claude</SectionTitle>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18, marginTop: -8 }}>
        This is private. Nothing here is sent anywhere unless you click "Talk it through."
      </p>

      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="What's weighing on you? Claude can help you think through it."
        rows={4}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8, padding: '10px 12px',
          fontSize: 13, color: 'var(--text-primary)',
          resize: 'vertical', outline: 'none',
          fontFamily: 'inherit', lineHeight: 1.6,
        }}
      />

      <button
        onClick={handleSubmit}
        disabled={!input.trim() || loading}
        style={{
          marginTop: 12,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 20px', borderRadius: 8,
          background: input.trim() && !loading ? 'rgba(72,185,199,0.12)' : 'transparent',
          border: `1px solid ${input.trim() && !loading ? 'rgba(72,185,199,0.3)' : 'var(--border-subtle)'}`,
          color: input.trim() && !loading ? 'var(--accent-primary)' : 'var(--text-muted)',
          fontSize: 13, fontWeight: 500,
          cursor: input.trim() && !loading ? 'pointer' : 'default',
          transition: 'all 0.15s',
        }}
      >
        <Send size={13} />
        {loading ? 'Thinking…' : 'Talk it through'}
      </button>

      {error && (
        <div style={{ marginTop: 16, fontSize: 13, color: 'var(--accent-red)' }}>{error}</div>
      )}

      {response && (
        <div style={{ marginTop: 20 }}>
          <div
            ref={responseRef}
            style={{
              fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.75,
              whiteSpace: 'pre-wrap',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: '16px 18px',
              maxHeight: 400, overflowY: 'auto',
            }}
          >
            {response}
          </div>
          <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            This is a thinking tool, not therapy. If you're struggling, please reach out to a mental health professional.
            If you're in crisis, the 988 Suicide and Crisis Lifeline is available 24/7 — call or text 988.
          </p>
        </div>
      )}
    </Section>
  )
}

// ── Main MindspaceView ────────────────────────────────────────────────────────
export default function MindspaceView() {
  const [todayCheckin, setTodayCheckin] = useState(() => {
    const all = loadMindspaceCheckins()
    return all[todayKey()] || null
  })

  const savedIntention = todayCheckin?.intention || null

  function handleCheckinSaved(entry) {
    setTodayCheckin(prev => ({ ...(prev || {}), ...entry }))
  }

  function handleIntentionSaved(text) {
    setTodayCheckin(prev => ({ ...(prev || {}), intention: text }))
  }

  return (
    <div
      style={{
        flex: 1, overflowY: 'auto',
        display: 'flex', justifyContent: 'center',
        padding: '40px 24px 60px',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 640,
          display: 'flex', flexDirection: 'column', gap: 32,
        }}
      >
        {/* Header */}
        <div>
          <h1
            style={{
              fontSize: 20, fontWeight: 400, color: 'var(--text-primary)',
              margin: 0, marginBottom: 6,
            }}
          >
            Mindspace
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            This space is just for you.
          </p>
        </div>

        {/* Saved intention banner */}
        {savedIntention && (
          <div
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic',
            }}
          >
            Today: "{savedIntention}"
          </div>
        )}

        <CheckInSection
          checkin={todayCheckin}
          onSaved={handleCheckinSaved}
        />

        <DBTSection />

        <IntentionSection
          savedIntention={savedIntention}
          onSaved={handleIntentionSaved}
        />

        <AskClaudeSection />
      </div>
    </div>
  )
}
