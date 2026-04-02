import { useState, useRef } from 'react'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Pencil, History } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import useStore from '../../store/useStore'
import TaskCard from './TaskCard'

const STATUS_OPTIONS   = ['backlog', 'todo', 'in-progress', 'done']
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent']

// ── Age-based dot color ───────────────────────────────────────────────────────
function dotColor(updatedAt) {
  if (!updatedAt) return 'var(--accent-green)'
  const days = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  if (days > 14) return 'var(--accent-red)'
  if (days > 7)  return 'var(--accent-orange)'
  return 'var(--accent-green)'
}

// ── Status Update sub-component ───────────────────────────────────────────────
function StatusUpdateSection({ bucket }) {
  const { updateBucketStatus } = useStore()
  const [editing, setEditing]         = useState(false)
  const [draft, setDraft]             = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [showMore, setShowMore]       = useState(false)
  const [hovered, setHovered]         = useState(false)
  const textareaRef = useRef(null)

  const su = bucket.statusUpdate || { text: '', updatedAt: null }
  const history = bucket.statusHistory || []
  const hasText = su.text?.trim()

  function startEdit() {
    setDraft(su.text || '')
    setEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  function save() {
    updateBucketStatus(bucket.id, draft.trim())
    setEditing(false)
    setShowHistory(false)
    setShowMore(false)
  }

  function cancel() {
    setEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); save() }
    if (e.key === 'Escape') cancel()
  }

  return (
    <div
      style={{
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        background: hasText && !editing ? '#1a1f1a' : 'transparent',
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowHistory(false) }}
    >
      {editing ? (
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's the current status? Where did you leave off?"
            rows={3}
            style={{
              width: '100%', fontSize: 13, lineHeight: 1.5,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 6, color: 'var(--text-primary)', outline: 'none',
              resize: 'none', padding: '7px 10px', boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={save} style={{ flex: 1, padding: '5px 8px', fontSize: 12, fontWeight: 500, background: 'var(--accent-primary)', color: '#0d1117', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Save</button>
            <button onClick={cancel} style={{ flex: 1, padding: '5px 8px', fontSize: 12, background: 'none', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', borderRadius: 5, cursor: 'pointer' }}>Cancel</button>
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Ctrl+Enter to save · Esc to cancel</span>
        </div>
      ) : hasText ? (
        <div style={{ padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: dotColor(su.updatedAt),
              boxShadow: `0 0 4px ${dotColor(su.updatedAt)}88`,
            }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1 }}>
              Last update · {su.updatedAt ? formatDistanceToNow(new Date(su.updatedAt), { addSuffix: true }) : '—'}
            </span>
            {history.length > 0 && (
              <button onClick={() => setShowHistory(v => !v)} title="Show history" style={{ background: 'none', border: 'none', cursor: 'pointer', color: showHistory ? 'var(--accent-primary)' : 'var(--text-muted)', padding: 2, display: 'flex', alignItems: 'center', opacity: hovered ? 1 : 0, transition: 'opacity 0.1s' }}>
                <History size={12} />
              </button>
            )}
            <button onClick={startEdit} title="Edit status" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex', alignItems: 'center', opacity: hovered ? 1 : 0, transition: 'opacity 0.1s' }}>
              <Pencil size={12} />
            </button>
          </div>
          <p style={{
            fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5,
            display: showMore ? 'block' : '-webkit-box',
            WebkitLineClamp: showMore ? undefined : 3,
            WebkitBoxOrient: 'vertical',
            overflow: showMore ? 'visible' : 'hidden',
          }}>
            {su.text}
          </p>
          {su.text.split('\n').join(' ').length > 160 && (
            <button onClick={() => setShowMore(v => !v)} style={{ fontSize: 11, color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', marginTop: 2 }}>
              {showMore ? 'show less' : 'show more'}
            </button>
          )}

          {showHistory && history.length > 0 && (
            <div style={{ marginTop: 8, borderTop: '1px solid var(--border-subtle)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {history.map((h, i) => (
                <div key={i} style={{ opacity: 0.7 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {h.updatedAt ? formatDistanceToNow(new Date(h.updatedAt), { addSuffix: true }) : '—'}
                  </span>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0', lineHeight: 1.35 }}>{h.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button onClick={startEdit} style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontStyle: 'italic', color: 'var(--text-muted)' }}>
          + Add status update
        </button>
      )}
    </div>
  )
}

// ── BucketColumn ──────────────────────────────────────────────────────────────
export default function BucketColumn({ bucket }) {
  const { addTask } = useStore()
  const [adding, setAdding] = useState(false)
  const [form, setForm]     = useState({ title: '', status: 'todo', priority: 'medium', dueDate: '' })

  const {
    attributes, listeners,
    setNodeRef: setColumnRef,
    transform, transition, isDragging,
  } = useSortable({ id: bucket.id, data: { type: 'column' } })

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: bucket.id })

  const sorted = [...bucket.tasks].sort((a, b) => {
    if (a.important && !b.important) return -1
    if (!a.important && b.important) return 1
    return 0
  })

  function submit() {
    const title = form.title.trim()
    if (!title) return
    addTask(bucket.id, { title, status: form.status, priority: form.priority, dueDate: form.dueDate || null })
    setForm({ title: '', status: 'todo', priority: 'medium', dueDate: '' })
    setAdding(false)
  }

  return (
    <div
      ref={setColumnRef}
      className="flex flex-col rounded-xl"
      style={{
        flex: '0 0 400px', minWidth: 400, maxWidth: 400, height: '100%',
        maxHeight: 'calc(100vh - 120px)',
        background: isOver ? 'rgba(72,185,199,0.05)' : 'var(--bg-surface)',
        border: `1px solid ${isOver ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
        transition: transition || 'border-color 0.15s, background 0.15s',
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0 : 1,
        scrollSnapAlign: 'start',
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border-subtle)', cursor: 'grab', userSelect: 'none', minWidth: 0 }}
        {...attributes}
        {...listeners}
      >
        <span
          title={bucket.name}
          style={{
            fontSize: 15, fontWeight: 600, color: 'var(--text-primary)',
            textTransform: 'uppercase', letterSpacing: '0.04em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            flex: 1, minWidth: 0,
          }}
        >
          {bucket.name}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderRadius: 999, padding: '2px 8px', flexShrink: 0, marginLeft: 8 }}>
          {bucket.tasks.length}
        </span>
      </div>

      {/* Status update section */}
      <StatusUpdateSection bucket={bucket} />

      {/* Task list */}
      <div ref={setDropRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        <SortableContext items={sorted.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {sorted.map(task => (
            <TaskCard key={task.id} task={{ ...task, bucketId: bucket.id, bucketName: bucket.name }} />
          ))}
        </SortableContext>

        {/* Inline add form */}
        {adding && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 10, marginTop: 4 }}>
            <input
              autoFocus
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setAdding(false) }}
              placeholder="Task title"
              style={{ padding: '7px 10px', fontSize: 14, background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', outline: 'none', width: '100%', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={selectStyle}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={selectStyle}>
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <input
              type="date"
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              style={{ ...selectStyle, width: '100%' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={submit} style={{ flex: 1, padding: '6px', background: 'var(--accent-primary)', color: '#0d1117', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Add</button>
              <button onClick={() => setAdding(false)} style={{ flex: 1, padding: '6px', background: 'none', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Add task button */}
      {!adding && (
        <div style={{ padding: '8px 8px 10px' }}>
          <button
            onClick={() => setAdding(true)}
            className="add-task-btn flex items-center gap-2 w-full rounded-lg"
            style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-muted)', background: 'transparent', border: '1px dashed var(--border-default)', cursor: 'pointer', textAlign: 'left', borderRadius: 8, transition: 'border-color 0.15s, color 0.15s, background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
          >
            <Plus size={14} /> Add task
          </button>
        </div>
      )}
    </div>
  )
}

const selectStyle = {
  flex: 1, padding: '5px 8px', fontSize: 12,
  background: 'var(--bg-base)', border: '1px solid var(--border-default)',
  borderRadius: 6, color: 'var(--text-secondary)', outline: 'none',
}
