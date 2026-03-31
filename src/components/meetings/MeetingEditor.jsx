import { useState } from 'react'
import { ArrowLeft, Sparkles } from 'lucide-react'
import useStore from '../../store/useStore'
import { generateId } from '../../utils/uuid'
import { callClaudeStream, getApiKey, getUserName } from '../../hooks/useAI'
import { format } from 'date-fns'

export default function MeetingEditor({ meetingId, onBack, onProcessed }) {
  const { meetings, saveMeeting, showToast } = useStore()

  const existing = meetingId ? meetings.find(m => m.id === meetingId) : null

  const [form, setForm] = useState({
    title:     existing?.title     || '',
    date:      existing?.date      ? existing.date.slice(0, 10) : format(new Date(), 'yyyy-MM-dd'),
    attendees: existing?.attendees || '',
    rawNotes:  existing?.rawNotes  || '',
  })
  const [processing, setProcessing]   = useState(false)
  const [streamPreview, setStreamPreview] = useState('')

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })) }

  async function process() {
    if (!form.rawNotes.trim()) { showToast('Add some notes first'); return }
    if (!getApiKey()) { showToast('Add an API key in Settings'); return }

    // Save draft first
    const id = meetingId || generateId()
    const meeting = {
      id,
      title:     form.title || 'Untitled meeting',
      date:      form.date,
      attendees: form.attendees,
      rawNotes:  form.rawNotes,
      processed: false,
      extractedData: null,
      createdAt: existing?.createdAt || new Date().toISOString(),
    }
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

    let full = ''
    try {
      full = await callClaudeStream(prompt, (_, f) => setStreamPreview(f))
      // Parse JSON
      const trimmed = full.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
      const parsed  = JSON.parse(trimmed)

      // Assign UUIDs to action items
      if (parsed.actionItems) {
        parsed.actionItems = parsed.actionItems.map(a => ({ ...a, id: generateId() }))
      }

      const saved = saveMeeting({ ...meeting, processed: true, extractedData: parsed })
      onProcessed(id)
    } catch (e) {
      showToast(`Processing failed: ${e.message}`)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={onBack} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={14} />
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {meetingId ? 'Edit meeting' : 'New meeting'}
        </span>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4 p-4">
        <Field label="Meeting title">
          <input value={form.title} onChange={set('title')} placeholder="E.g. Site readiness review" style={inputStyle} />
        </Field>
        <div className="flex gap-3">
          <Field label="Date" style={{ flex: 1 }}>
            <input type="date" value={form.date} onChange={set('date')} style={inputStyle} />
          </Field>
        </div>
        <Field label="Attendees (comma-separated)">
          <input value={form.attendees} onChange={set('attendees')} placeholder="Sarah, Mike, Priya…" style={inputStyle} />
        </Field>
        <Field label="Notes">
          <textarea
            value={form.rawNotes}
            onChange={set('rawNotes')}
            placeholder="Paste or type your raw meeting notes here…"
            rows={10}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          />
        </Field>

        {/* Process button */}
        <button
          onClick={process}
          disabled={processing}
          style={{
            padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: processing ? 'rgba(157,127,232,0.2)' : 'rgba(157,127,232,0.15)',
            color: '#9d7fe8', border: '1px solid rgba(157,127,232,0.3)',
            cursor: processing ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}
        >
          <Sparkles size={14} />
          {processing ? 'Processing…' : 'Process with Claude'}
        </button>

        {/* Stream preview */}
        {streamPreview && (
          <div style={{ padding: '8px 10px', borderRadius: 8, fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', fontFamily: 'monospace', maxHeight: 120, overflow: 'hidden', whiteSpace: 'pre-wrap' }}>
            {streamPreview.slice(-400)}
            {processing && <span className="streaming-cursor" />}
          </div>
        )}
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
