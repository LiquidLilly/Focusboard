import { useState, useRef } from 'react'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Pencil, History, MoreHorizontal } from 'lucide-react'
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
  if (days > 7)  return 'var(--accent-warm)'
  return 'var(--accent-green)'
}

// ── Status Update section ─────────────────────────────────────────────────────
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

  function cancel() { setEditing(false) }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); save() }
    if (e.key === 'Escape') cancel()
  }

  return (
    <div
      style={{
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
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
            placeholder="What's the current status?"
            rows={3}
            style={{
              width: '100%', fontSize: 13, lineHeight: 1.5,
              background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
              borderRadius: 6, color: 'var(--text-primary)', outline: 'none',
              resize: 'none', padding: '7px 10px', boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={save} style={{ flex: 1, padding: '5px 8px', fontSize: 12, fontWeight: 500, background: 'var(--accent)', color: 'var(--text-inverse)', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Save</button>
            <button onClick={cancel} style={{ flex: 1, padding: '5px 8px', fontSize: 12, background: 'none', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', borderRadius: 5, cursor: 'pointer' }}>Cancel</button>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ctrl+Enter to save · Esc to cancel</span>
        </div>
      ) : hasText ? (
        <div style={{ padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: dotColor(su.updatedAt),
            }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1 }}>
              {su.updatedAt ? formatDistanceToNow(new Date(su.updatedAt), { addSuffix: true }) : '—'}
            </span>
            {history.length > 0 && (
              <button onClick={() => setShowHistory(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: showHistory ? 'var(--accent)' : 'var(--text-muted)', padding: 2, display: 'flex', alignItems: 'center', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
                <History size={12} />
              </button>
            )}
            <button onClick={startEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex', alignItems: 'center', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
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
          {su.text.length > 160 && (
            <button onClick={() => setShowMore(v => !v)} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', marginTop: 2 }}>
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
          + What's the status?
        </button>
      )}
    </div>
  )
}

// ── BucketColumn ──────────────────────────────────────────────────────────────
export default function BucketColumn({ bucket }) {
  const { addTask, deleteBucket, updateBucket } = useStore()
  const [adding, setAdding]   = useState(false)
  const [form, setForm]       = useState({ title: '', status: 'todo', priority: 'medium', dueDate: '' })
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

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
      style={{
        flex: '0 0 380px', width: 380, height: '100%',
        display: 'flex', flexDirection: 'column',
        background: isOver ? 'rgba(91,156,246,0.04)' : 'var(--bg-surface)',
        border: `1px solid ${isOver ? 'var(--accent)' : 'var(--border-subtle)'}`,
        borderRadius: 12,
        transition: transition || 'border-color 0.15s, background 0.15s',
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0 : 1,
      }}
    >
      {/* Column header */}
      <div
        style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border-subtle)', cursor: 'grab', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}
        {...attributes}
        {...listeners}
      >
        <span style={{
          fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {bucket.name}
        </span>
        <span style={{ fontSize: 11, background: 'var(--bg-raised)', color: 'var(--text-muted)', borderRadius: 999, padding: '2px 7px', flexShrink: 0 }}>
          {bucket.tasks.length}
        </span>
        <div style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex', alignItems: 'center' }}
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 50,
              background: 'var(--bg-overlay)', border: '1px solid var(--border-default)',
              borderRadius: 8, padding: '4px 0', minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              <MenuItem onClick={() => { setRenaming(true); setNameDraft(bucket.name); setMenuOpen(false) }}>Rename bucket</MenuItem>
              {!bucket.isCore && (
                <MenuItem color="var(--accent-red)" onClick={() => { deleteBucket(bucket.id); setMenuOpen(false) }}>Delete bucket</MenuItem>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rename inline */}
      {renaming && (
        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 6 }}>
          <input
            autoFocus
            value={nameDraft}
            onChange={e => setNameDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { updateBucket(bucket.id, { name: nameDraft.trim() }); setRenaming(false) }
              if (e.key === 'Escape') setRenaming(false)
            }}
            style={{ flex: 1, padding: '5px 8px', fontSize: 13, background: 'var(--bg-raised)', border: '1px solid var(--border-focus)', borderRadius: 6, color: 'var(--text-primary)', outline: 'none' }}
          />
          <button onClick={() => { updateBucket(bucket.id, { name: nameDraft.trim() }); setRenaming(false) }} style={{ padding: '5px 10px', fontSize: 12, background: 'var(--accent)', color: 'var(--text-inverse)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Save</button>
        </div>
      )}

      {/* Status update */}
      <StatusUpdateSection bucket={bucket} />

      {/* Task list */}
      <div ref={setDropRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        <SortableContext items={sorted.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {sorted.map(task => (
            <TaskCard key={task.id} task={{ ...task, bucketId: bucket.id, bucketName: bucket.name }} />
          ))}
        </SortableContext>

        {/* Inline add form */}
        {adding && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 10, marginTop: 4 }}>
            <input
              autoFocus
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setAdding(false) }}
              placeholder="Task title"
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={selectStyle}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={selectStyle}>
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} style={{ ...selectStyle, width: '100%' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={submit} style={{ flex: 1, padding: '6px', background: 'var(--accent)', color: 'var(--text-inverse)', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Add</button>
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
            style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '10px 16px', fontSize: 13, color: 'var(--text-muted)', background: 'transparent', border: '1px dashed var(--border-default)', cursor: 'pointer', textAlign: 'left', borderRadius: 8, transition: 'all 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <Plus size={14} /> Add task
          </button>
        </div>
      )}
    </div>
  )
}

function MenuItem({ onClick, color, children }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 14px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: color || 'var(--text-secondary)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-raised)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
    >
      {children}
    </button>
  )
}

const selectStyle = {
  flex: 1, padding: '5px 8px', fontSize: 12,
  background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
  borderRadius: 6, color: 'var(--text-secondary)', outline: 'none',
}

const inputStyle = {
  padding: '7px 10px', fontSize: 14, background: 'var(--bg-base)',
  border: '1px solid var(--border-default)', borderRadius: 6,
  color: 'var(--text-primary)', outline: 'none', width: '100%', boxSizing: 'border-box',
}
