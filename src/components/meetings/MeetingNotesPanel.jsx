import { useState } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import useStore from '../../store/useStore'
import MeetingList from './MeetingList'
import MeetingEditor from './MeetingEditor'
import MeetingResults from './MeetingResults'

export default function MeetingNotesPanel() {
  const { rightPanelOpen, setRightPanel, activeMeetingId, meetings } = useStore()
  const [view, setView] = useState('list') // 'list' | 'editor' | 'results'
  const [editingId, setEditingId] = useState(null) // null = new meeting

  const activeMeeting = activeMeetingId ? meetings.find(m => m.id === activeMeetingId) : null

  function openNew() { setEditingId(null); setView('editor') }
  function openMeeting(meeting) {
    setEditingId(meeting.id)
    setView(meeting.processed ? 'results' : 'editor')
  }
  function backToList() { setView('list') }

  if (!rightPanelOpen) {
    return (
      <div
        className="flex items-center justify-center cursor-pointer"
        style={{ width: 28, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-subtle)' }}
        onClick={() => setRightPanel(true)}
        title="Open Meeting Notes"
      >
        <ChevronLeft size={14} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
        <div style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Meeting Notes
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ width: 320, minWidth: 320, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-subtle)' }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
          Meeting Notes
        </span>
        <button onClick={() => setRightPanel(false)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', padding: 2, cursor: 'pointer' }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {view === 'list' && (
          <MeetingList
            onNew={openNew}
            onOpen={openMeeting}
          />
        )}
        {view === 'editor' && (
          <MeetingEditor
            meetingId={editingId}
            onBack={backToList}
            onProcessed={(id) => { setEditingId(id); setView('results') }}
          />
        )}
        {view === 'results' && (
          <MeetingResults
            meetingId={editingId}
            onBack={backToList}
            onEdit={() => setView('editor')}
          />
        )}
      </div>
    </div>
  )
}
