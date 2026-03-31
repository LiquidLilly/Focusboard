import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Sparkles, Save, MessageSquare, Send } from 'lucide-react'
import useStore from '../../store/useStore'
import { generateId } from '../../utils/uuid'
import { callClaudeStream, getApiKey, getUserName } from '../../hooks/useAI'
import { format } from 'date-fns'

const SYSTEM_PROMPT_BASE = `You are an assistant embedded in a personal productivity tool. The user has ADHD and anxiety. They:
- Struggle to catch implicit expectations, social commitments, or details said between the lines
- Tend to miss follow-up items not explicitly assigned to them
- Can become overwhelmed by long lists or vague direction
- Need proactive, specific, direct help — not generic advice

Be calm, direct, and specific. Use short bullets over paragraphs. Surface what they might miss. Never be vague.`

export default function MeetingEditor({ meetingId, onBack, onProcessed }) {
  const { meetings, saveMeeting, showToast } = useStore()

  const existing = meetingId ? meetings.find(m => m.id === meetingId) : null

  const [panelMode, setPanelMode] = useState('extract') // 'extract' | 'chat'
  const [form, setForm] = useState({
    title:     existing?.title     || '',
    date:      existing?.date      ? existing.date.slice(0, 10) : format(new Date(), 'yyyy-MM-dd'),
    attendees: existing?.attendees || '',
    rawNotes:  existing?.rawNotes  || '',
  })
  const [processing, setProcessing]     = useState(false)
  const [streamPreview, setStreamPreview] = useState('')

  // Chat state
  const [chatHistory, setChatHistory] = useState(existing?.chatHistory || [])
  const [chatInput, setChatInput]     = useState('')
  const [chatStreaming, setChatStreaming] = useState(false)
  const [notesCollapsed, setNotesCollapsed] = useState(true)
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (panelMode === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, panelMode])

  function setField(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })) }

  function buildMeeting(id, extraFields = {}) {
    return {
      id,
      title:         form.title || 'Untitled meeting',
      date:          form.date,
      attendees:     form.attendees,
      rawNotes:      form.rawNotes,
      processed:     false,
      extractedData: existing?.extractedData || null,
      chatHistory:   chatHistory,
      createdAt:     existing?.createdAt || new Date().toISOString(),
      ...extraFields,
    }
  }

  function saveNotes() {
    if (!form.rawNotes.trim() && !form.title.trim()) { showToast('Add a title or some notes first'); return }
    const id = meetingId || generateId()
    saveMeeting(buildMeeting(id))
    showToast('Notes saved')
    onBack()
  }

  async function process() {
    if (!form.rawNotes.trim()) { showToast('Add some notes first'); return }
    if (!getApiKey()) { showToast('Add an API key in Settings'); return }

    const id = meetingId || generateId()
    const meeting = buildMeeting(id)
    saveMeeting(meeting)

    setProcessing(true); setStreamPreview('')

    const prompt = `Meeting title: "${meeting.title}"
Date: ${meeting.date}
Attendees: ${meeting.attendees || 'not specified'}

Raw notes:
${meeting.rawNotes}

Extract and return a JSON object with these keys:
{
  "actionItems": [{"id": "...", "text": "...", "bucketName": "..."}],
  "decisions": ["string"],
  "followUps": ["string"],
  "deadlines": ["string"],
  "mightHaveMissed": ["string — implicit expectations, commitments made on user's behalf, anything said between the lines, anything that could blindside them"],
  "questionsToAsk": ["string"]
}

For actionItems, pick the most relevant bucket from: Site Startup Support, MES/Automation, Process School, Supply Chain, Data Trending/APR, Process Cleaning, Contamination Control. Set id to a short random string.
For mightHaveMissed, be proactive — look for implicit expectations, unstated assumptions, items where the user might be assumed responsible without being told explicitly. This is the most important section.
Return ONLY valid JSON. No markdown, no commentary.`

    try {
      const full = await callClaudeStream(prompt, (_, f) => setStreamPreview(f))
      const trimmed = full.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
      const parsed  = JSON.parse(trimmed)

      if (parsed.actionItems) {
        parsed.actionItems = parsed.actionItems.map(a => ({ ...a, id: generateId() }))
      }

      saveMeeting({ ...meeting, processed: true, extractedData: parsed })
      onProcessed(id)
    } catch (e) {
      showToast(`Processing failed: ${e.message}`)
    } finally {
      setProcessing(false)
    }
  }

  async function sendChat() {
    const msg = chatInput.trim()
    if (!msg) return
    if (!getApiKey()) { showToast('Add an API key in Settings'); return }

    const userMsg = { role: 'user', content: msg, id: generateId() }
    const newHistory = [...chatHistory, userMsg]
    setChatHistory(newHistory)
    setChatInput('')
    setChatStreaming(true)

    const assistantMsg = { role: 'assistant', content: '', id: generateId() }
    setChatHistory(h => [...h, assistantMsg])

    const meetingContext = `Meeting: "${form.title || 'Untitled'}" on ${form.date}
Attendees: ${form.attendees || 'not specified'}

Raw notes:
${form.rawNotes || '(no notes yet)'}

---`

    const systemPrompt = `${SYSTEM_PROMPT_BASE}

You are helping the user analyze and understand their meeting notes. The meeting details are:

${meetingContext}`

    const apiMessages = newHistory.map(m => ({ role: m.role, content: m.content }))

    let full = ''
    try {
      full = await callClaudeStream(
        apiMessages[apiMessages.length - 1].content,
        (_, f) => {
          full = f
          setChatHistory(h => h.map(m => m.id === assistantMsg.id ? { ...m, content: f } : m))
        },
        systemPrompt,
        1024,
      )
      // Persist updated chat history to meeting
      const id = meetingId || generateId()
      const finalHistory = [...newHistory, { ...assistantMsg, content: full }]
      setChatHistory(finalHistory)
      saveMeeting(buildMeeting(id, { chatHistory: finalHistory }))
    } catch (e) {
      const errMsg = `Error: ${e.message}`
      setChatHistory(h => h.map(m => m.id === assistantMsg.id ? { ...m, content: errMsg } : m))
    } finally {
      setChatStreaming(false)
    }
  }

  function onChatKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full" style={{ overflow: 'hidden' }}>
      {/* Toolbar with back + mode toggle */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <button onClick={onBack} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={14} />
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>
          {meetingId ? 'Edit meeting' : 'New meeting'}
        </span>
        {/* Mode toggle */}
        <div className="flex" style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 2, gap: 1 }}>
          <ModeBtn active={panelMode === 'extract'} onClick={() => setPanelMode('extract')} label="Auto Extract" />
          <ModeBtn active={panelMode === 'chat'} onClick={() => setPanelMode('chat')} label="Chat" icon={<MessageSquare size={11} />} />
        </div>
      </div>

      {panelMode === 'extract' ? (
        /* ── Auto Extract mode ─────────────────────────────────────────── */
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 p-4">
            <Field label="Meeting title">
              <input value={form.title} onChange={setField('title')} placeholder="E.g. Site readiness review" style={inputStyle} />
            </Field>
            <Field label="Date">
              <input type="date" value={form.date} onChange={setField('date')} style={inputStyle} />
            </Field>
            <Field label="Attendees (comma-separated)">
              <input value={form.attendees} onChange={setField('attendees')} placeholder="Sarah, Mike, Priya…" style={inputStyle} />
            </Field>
            <Field label="Notes">
              <textarea
                value={form.rawNotes}
                onChange={setField('rawNotes')}
                placeholder="Paste or type your raw meeting notes here…"
                rows={10}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
            </Field>

            <div className="flex gap-2">
              <button
                onClick={saveNotes}
                disabled={processing}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: 'none', color: 'var(--text-secondary)',
                  border: '1px solid var(--border-default)',
                  cursor: processing ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  opacity: processing ? 0.5 : 1,
                }}
              >
                <Save size={13} /> Save Notes
              </button>

              <button
                onClick={process}
                disabled={processing}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: processing ? 'rgba(157,127,232,0.2)' : 'rgba(157,127,232,0.15)',
                  color: '#9d7fe8', border: '1px solid rgba(157,127,232,0.3)',
                  cursor: processing ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <Sparkles size={13} />
                {processing ? 'Processing…' : 'Process with Claude'}
              </button>
            </div>

            {streamPreview && (
              <div style={{ padding: '8px 10px', borderRadius: 8, fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', fontFamily: 'monospace', maxHeight: 120, overflow: 'hidden', whiteSpace: 'pre-wrap' }}>
                {streamPreview.slice(-400)}
                {processing && <span className="streaming-cursor" />}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Chat with Claude mode ─────────────────────────────────────── */
        <div className="flex flex-col flex-1" style={{ overflow: 'hidden' }}>
          {/* Meeting notes context (collapsible) */}
          <div style={{ borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <button
              onClick={() => setNotesCollapsed(v => !v)}
              style={{ width: '100%', padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {notesCollapsed ? '▸' : '▾'}
              <span>{form.title || 'Untitled meeting'} — notes context</span>
              {notesCollapsed && form.rawNotes && (
                <span style={{ marginLeft: 4, color: 'var(--text-muted)', fontSize: 10 }}>
                  ({form.rawNotes.length} chars)
                </span>
              )}
            </button>
            {!notesCollapsed && (
              <div style={{ padding: '0 12px 10px', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.6, maxHeight: 140, overflowY: 'auto' }}>
                {form.rawNotes || <em>No notes yet — switch to Auto Extract to add notes.</em>}
              </div>
            )}
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
            {chatHistory.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Ask Claude anything about your meeting notes.
                </p>
                <div className="flex flex-col gap-2 mt-4">
                  {['What are my action items?', 'What did I miss?', 'Who owns what?'].map(s => (
                    <button
                      key={s}
                      onClick={() => { setChatInput(s) }}
                      style={{ padding: '5px 10px', fontSize: 11, borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chatHistory.map((msg) => (
              <ChatBubble key={msg.id} msg={msg} isStreaming={chatStreaming && msg === chatHistory[chatHistory.length - 1] && msg.role === 'assistant'} />
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="px-3 py-3" style={{ borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <div className="flex gap-2 items-end">
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={onChatKeyDown}
                placeholder="Ask about your notes… (Enter to send)"
                rows={2}
                style={{
                  flex: 1, padding: '7px 10px', fontSize: 12, resize: 'none',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                  borderRadius: 8, color: 'var(--text-primary)', outline: 'none', lineHeight: 1.5,
                }}
              />
              <button
                onClick={sendChat}
                disabled={chatStreaming || !chatInput.trim()}
                style={{
                  padding: '8px 10px', borderRadius: 8,
                  background: chatStreaming || !chatInput.trim() ? 'var(--bg-elevated)' : 'rgba(157,127,232,0.15)',
                  border: '1px solid rgba(157,127,232,0.3)',
                  color: chatStreaming || !chatInput.trim() ? 'var(--text-muted)' : '#9d7fe8',
                  cursor: chatStreaming || !chatInput.trim() ? 'default' : 'pointer',
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ModeBtn({ active, onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 8px', fontSize: 11, fontWeight: active ? 600 : 400,
        background: active ? 'var(--bg-overlay)' : 'none',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        border: 'none', borderRadius: 6, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4,
      }}
    >
      {icon}{label}
    </button>
  )
}

function ChatBubble({ msg, isStreaming }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          maxWidth: '85%', padding: '8px 11px', borderRadius: isUser ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
          fontSize: 12, lineHeight: 1.55, whiteSpace: 'pre-wrap',
          background: isUser ? 'rgba(157,127,232,0.15)' : 'var(--bg-elevated)',
          border: `1px solid ${isUser ? 'rgba(157,127,232,0.25)' : 'var(--border-subtle)'}`,
          color: 'var(--text-primary)',
        }}
      >
        {msg.content || (isStreaming ? '' : '…')}
        {isStreaming && <span className="streaming-cursor" />}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '7px 10px', fontSize: 13,
  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
  borderRadius: 8, color: 'var(--text-primary)', outline: 'none',
}
