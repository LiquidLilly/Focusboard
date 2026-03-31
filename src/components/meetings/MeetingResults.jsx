import { useState } from 'react'
import { ArrowLeft, ArrowRight, Edit2, AlertTriangle, Check } from 'lucide-react'
import useStore from '../../store/useStore'
import { formatFullDate } from '../../utils/dates'

export default function MeetingResults({ meetingId, onBack, onEdit }) {
  const { meetings, buckets, addTaskFromMeeting, showToast } = useStore()
  const meeting = meetings.find(m => m.id === meetingId)
  if (!meeting) return null

  const d = meeting.extractedData || {}

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={onBack} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={14} />
        </button>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{meeting.title}</span>
        <button onClick={onEdit} title="Edit notes" style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <Edit2 size={14} />
        </button>
      </div>

      <div className="flex flex-col gap-5 p-4">
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatFullDate(meeting.date)} · {meeting.attendees}</p>

        {/* Action items */}
        {d.actionItems?.length > 0 && (
          <Section title="Action items for me" color="var(--accent-primary)">
            <div className="flex flex-col gap-2">
              {d.actionItems.map(item => (
                <ActionItemCard key={item.id} item={item} meetingId={meeting.id} />
              ))}
            </div>
          </Section>
        )}

        {/* Might have missed — most important, orange treatment */}
        {d.mightHaveMissed?.length > 0 && (
          <div style={{ padding: '10px 12px', borderRadius: 10, background: '#1a160a', borderLeft: '3px solid var(--accent-orange)', border: '1px solid rgba(233,168,76,0.2)', borderLeftColor: 'var(--accent-orange)' }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} style={{ color: 'var(--accent-orange)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-orange)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Don't miss this</span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {d.mightHaveMissed.map((item, i) => (
                <li key={i} style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.55, paddingLeft: 12, borderLeft: '2px solid rgba(233,168,76,0.3)' }}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Decisions */}
        {d.decisions?.length > 0 && (
          <Section title="Decisions made">
            <BulletList items={d.decisions} />
          </Section>
        )}

        {/* Follow-ups */}
        {d.followUps?.length > 0 && (
          <Section title="Follow-ups">
            <BulletList items={d.followUps} />
          </Section>
        )}

        {/* Deadlines */}
        {d.deadlines?.length > 0 && (
          <Section title="Deadlines mentioned" color="var(--accent-orange)">
            <BulletList items={d.deadlines} />
          </Section>
        )}

        {/* Questions */}
        {d.questionsToAsk?.length > 0 && (
          <Section title="Questions to ask">
            <BulletList items={d.questionsToAsk} />
          </Section>
        )}

        {/* Raw notes collapsible */}
        <RawNotes notes={meeting.rawNotes} />
      </div>
    </div>
  )
}

function ActionItemCard({ item, meetingId }) {
  const { buckets, addTaskFromMeeting } = useStore()
  const [added, setAdded]           = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  function addToBoard(bucketId) {
    addTaskFromMeeting(bucketId, { title: item.text, meetingId })
    setAdded(true)
    setShowPicker(false)
  }

  // Try to pre-select the suggested bucket
  const suggested = buckets.find(b => b.name === item.bucketName) || buckets[0]

  return (
    <div style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
      <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 6 }}>{item.text}</p>
      {item.bucketName && (
        <p style={{ fontSize: 10, color: 'var(--accent-purple)', marginBottom: 6 }}>Suggested: {item.bucketName}</p>
      )}

      {added ? (
        <span style={{ fontSize: 11, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Check size={11} /> Added to board
        </span>
      ) : (
        <div className="relative">
          <button
            onClick={() => setShowPicker(v => !v)}
            style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(157,127,232,0.12)', color: '#9d7fe8', border: '1px solid rgba(157,127,232,0.2)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <ArrowRight size={11} /> Add to Board
          </button>
          {showPicker && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, minWidth: 200, background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 4, zIndex: 20 }}>
              {buckets.map(b => (
                <button
                  key={b.id}
                  onClick={() => addToBoard(b.id)}
                  style={{ display: 'block', width: '100%', padding: '6px 10px', fontSize: 12, textAlign: 'left', color: b.name === item.bucketName ? 'var(--accent-primary)' : 'var(--text-primary)', background: 'none', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                  className="hover:bg-bg-elevated"
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, color, children }) {
  return (
    <div className="flex flex-col gap-2">
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: color || 'var(--text-secondary)' }}>{title}</span>
      {children}
    </div>
  )
}

function BulletList({ items }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.55, paddingLeft: 12, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 0, color: 'var(--text-muted)' }}>·</span>
          {item}
        </li>
      ))}
    </ul>
  )
}

function RawNotes({ notes }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button onClick={() => setOpen(v => !v)} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        {open ? '▾' : '▸'} Raw notes
      </button>
      {open && (
        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, fontSize: 11, background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {notes}
        </div>
      )}
    </div>
  )
}
