import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Plus } from 'lucide-react'
import useStore from '../../store/useStore'
import TaskCard from './TaskCard'

const STATUS_OPTIONS   = ['backlog', 'todo', 'in-progress', 'done']
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent']

export default function BucketColumn({ bucket }) {
  const { addTask } = useStore()
  const [adding, setAdding]   = useState(false)
  const [form, setForm]       = useState({ title: '', status: 'todo', priority: 'medium', dueDate: '' })

  // Column-level sortable (for reordering columns by dragging the header)
  const {
    attributes,
    listeners,
    setNodeRef: setColumnRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bucket.id, data: { type: 'column' } })

  // Task drop zone (separate ref so tasks can still be dropped inside)
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: bucket.id })

  // Important tasks sort first
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
      className="flex flex-col shrink-0 rounded-xl"
      style={{
        width: 260, height: '100%',
        background: isOver ? 'rgba(72,185,199,0.05)' : 'var(--bg-surface)',
        border: `1px solid ${isOver ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
        transition: transition || 'border-color 0.15s, background 0.15s',
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0 : 1,
      }}
    >
      {/* Column header — full header area is the drag handle */}
      <div
        className="flex items-center justify-between px-3 py-3"
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          cursor: 'grab',
          userSelect: 'none',
        }}
        {...attributes}
        {...listeners}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {bucket.name}
        </span>
        <span
          style={{
            fontSize: 10, fontWeight: 600, background: 'var(--bg-elevated)',
            color: 'var(--text-muted)', borderRadius: 999, padding: '2px 8px',
          }}
        >
          {bucket.tasks.length}
        </span>
      </div>

      {/* Task list */}
      <div ref={setDropRef} className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-2">
        <SortableContext items={sorted.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {sorted.map(task => (
            <TaskCard key={task.id} task={{ ...task, bucketId: bucket.id, bucketName: bucket.name }} />
          ))}
        </SortableContext>

        {/* Inline add form */}
        {adding && (
          <div className="flex flex-col gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <input
              autoFocus
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setAdding(false) }}
              placeholder="Task title"
              style={{ padding: '5px 8px', fontSize: 13, background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', outline: 'none', width: '100%' }}
            />
            <div className="flex gap-1">
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                style={selectStyle}
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                style={selectStyle}
              >
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <input
              type="date"
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              style={{ ...selectStyle, width: '100%' }}
            />
            <div className="flex gap-1">
              <button onClick={submit} style={{ flex: 1, padding: '4px', background: 'var(--accent-primary)', color: '#0d1117', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Add</button>
              <button onClick={() => setAdding(false)} style={{ flex: 1, padding: '4px', background: 'none', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', borderRadius: 5, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Add task button */}
      {!adding && (
        <div className="px-2 pb-2">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 w-full rounded-lg"
            style={{ padding: '6px 8px', fontSize: 12, color: 'var(--text-muted)', background: 'transparent', border: '1px dashed var(--border-subtle)', cursor: 'pointer' }}
          >
            <Plus size={13} /> Add task
          </button>
        </div>
      )}
    </div>
  )
}

const selectStyle = {
  flex: 1, padding: '4px 6px', fontSize: 11,
  background: 'var(--bg-base)', border: '1px solid var(--border-default)',
  borderRadius: 5, color: 'var(--text-secondary)', outline: 'none',
}
