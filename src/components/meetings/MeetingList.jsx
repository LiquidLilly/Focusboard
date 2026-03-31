import { format } from 'date-fns'
import { Plus, FileText } from 'lucide-react'
import useStore from '../../store/useStore'
import { formatFullDate } from '../../utils/dates'

export default function MeetingList({ onNew, onOpen }) {
  const { meetings, activeMeetingId } = useStore()

  const sorted = [...meetings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <div className="flex flex-col h-full">
      {/* New meeting button */}
      <div className="px-3 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <button
          onClick={onNew}
          style={{
            width: '100%', padding: '7px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: 'var(--accent-primary)', color: '#0d1117', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <Plus size={14} /> New Meeting Note
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {sorted.length === 0 ? (
          <div className="text-center py-8">
            <FileText size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No meetings yet</p>
          </div>
        ) : (
          sorted.map(m => (
            <MeetingRow
              key={m.id}
              meeting={m}
              isActive={m.id === activeMeetingId}
              onClick={() => onOpen(m)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function MeetingRow({ meeting, isActive, onClick }) {
  const taskCount = meeting.extractedData?.actionItems?.length || 0
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-1 text-left w-full rounded-xl p-3"
      style={{
        background: isActive ? 'rgba(72,185,199,0.08)' : 'var(--bg-elevated)',
        border: `1px solid ${isActive ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
        cursor: 'pointer',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>{meeting.title}</span>
        {meeting.processed && (
          <span style={{ fontSize: 10, color: 'var(--accent-purple)', background: 'rgba(157,127,232,0.12)', borderRadius: 999, padding: '2px 6px', flexShrink: 0 }}>AI ✓</span>
        )}
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {formatFullDate(meeting.date)}
        {taskCount > 0 && ` · ${taskCount} action${taskCount !== 1 ? 's' : ''}`}
      </span>
    </button>
  )
}
