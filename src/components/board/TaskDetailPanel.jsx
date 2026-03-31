import { useState, useEffect, useRef } from 'react'
import { X, Star, Plus, Trash2, Check, Sparkles, ExternalLink } from 'lucide-react'
import useStore from '../../store/useStore'
import { formatDueDate, isOverdue, isDueSoon } from '../../utils/dates'
import { callClaudeStream, getApiKey } from '../../hooks/useAI'

const STATUS_OPTIONS   = ['backlog', 'todo', 'in-progress', 'done']
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent']

const STATUS_COLORS  = { backlog: '#48b9c7', todo: '#8b949e', 'in-progress': '#9d7fe8', done: '#4caf82' }
const PRIORITY_COLORS = { low: '#8b949e', medium: '#48b9c7', high: '#e9a84c', urgent: '#e05c5c' }

export default function TaskDetailPanel() {
  const {
    selectedTaskId, setSelectedTask,
    getTask, getTaskBucket, updateTask, deleteTask,
    addSubtask, toggleSubtask, deleteSubtask,
    meetings, setActiveMeeting, setRightPanel,
    showToast,
  } = useStore()

  const task   = getTask(selectedTaskId)
  const bucket = getTaskBucket(selectedTaskId)

  const [newSub, setNewSub]     = useState('')
  const [aiText, setAiText]     = useState(null)
  const [streaming, setStreaming] = useState(false)
  const panelRef = useRef()

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setSelectedTask(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Click-outside close
  useEffect(() => {
    function onClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setSelectedTask(null)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!task) return null

  const meeting = task.meetingId ? meetings.find(m => m.id === task.meetingId) : null
  const overdue = isOverdue(task.dueDate)
  const dueSoon = isDueSoon(task.dueDate)

  function update(field, value) { updateTask(task.id, { [field]: value }) }

  function addSub() {
    const t = newSub.trim(); if (!t) return
    addSubtask(task.id, t); setNewSub('')
  }

  async function aiAssist() {
    if (!getApiKey()) { showToast('Add an API key in Settings'); return }
    setStreaming(true); setAiText('')
    const allSubtasks = task.subtasks?.length
      ? `\nSubtasks: ${task.subtasks.map(s => `${s.done ? '✓' : '○'} ${s.title}`).join(', ')}`
      : ''
    try {
      await callClaudeStream(
        `Task: "${task.title}"\nBucket: ${bucket?.name || 'unknown'}\nStatus: ${task.status}\nPriority: ${task.priority}${task.dueDate ? `\nDue: ${task.dueDate}` : ''}${allSubtasks}\n\nSurface what's missing, suggest next steps, and flag any risks. Be specific and direct.`,
        (_, full) => setAiText(full),
      )
    } catch (e) {
      setAiText(`Error: ${e.message}`)
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div
      ref={panelRef}
      className="fixed right-0 top-0 bottom-0 z-30 flex flex-col overflow-y-auto"
      style={{
        width: 400, background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-default)',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex flex-col gap-1 flex-1 mr-3">
          <input
            value={task.title}
            onChange={e => update('title', e.target.value)}
            style={{ fontSize: 15, fontWeight: 600, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%' }}
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{bucket?.name}</span>
        </div>
        <button onClick={() => setSelectedTask(null)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', padding: 4, cursor: 'pointer', flexShrink: 0 }}>
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-5 p-4">
        {/* Meta fields */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <select value={task.status} onChange={e => update('status', e.target.value)} style={selectStyle}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select value={task.priority} onChange={e => update('priority', e.target.value)} style={selectStyle}>
              {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Due date">
            <input
              type="date"
              value={task.dueDate ? task.dueDate.slice(0, 10) : ''}
              onChange={e => update('dueDate', e.target.value || null)}
              style={{ ...selectStyle, color: overdue ? 'var(--accent-red)' : dueSoon ? 'var(--accent-orange)' : 'var(--text-primary)' }}
            />
          </Field>
          <Field label="Important">
            <button
              onClick={() => update('important', !task.important)}
              style={{
                padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                background: task.important ? 'rgba(233,168,76,0.15)' : 'var(--bg-elevated)',
                color: task.important ? 'var(--accent-orange)' : 'var(--text-muted)',
                border: `1px solid ${task.important ? 'var(--accent-orange)' : 'var(--border-default)'}`,
              }}
            >
              <Star size={12} fill={task.important ? 'var(--accent-orange)' : 'none'} style={{ display: 'inline', marginRight: 4 }} />
              {task.important ? 'Flagged' : 'Flag'}
            </button>
          </Field>
        </div>

        {/* Description */}
        <Field label="Description">
          <textarea
            value={task.description || ''}
            onChange={e => update('description', e.target.value)}
            rows={3}
            placeholder="Add notes..."
            style={{ ...selectStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
        </Field>

        {/* Subtasks */}
        <div className="flex flex-col gap-2">
          <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)' }}>
            Subtasks ({task.subtasks?.filter(s => s.done).length || 0}/{task.subtasks?.length || 0})
          </label>
          {task.subtasks?.map(sub => (
            <div key={sub.id} className="flex items-center gap-2 group">
              <button
                onClick={() => toggleSubtask(task.id, sub.id)}
                style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
                  border: `1.5px solid ${sub.done ? 'var(--accent-green)' : 'var(--border-default)'}`,
                  background: sub.done ? 'var(--accent-green)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {sub.done && <Check size={10} color="#0d1117" />}
              </button>
              <span style={{ flex: 1, fontSize: 13, color: sub.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: sub.done ? 'line-through' : 'none' }}>{sub.title}</span>
              <button onClick={() => deleteSubtask(task.id, sub.id)} className="opacity-0 group-hover:opacity-100" style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={newSub}
              onChange={e => setNewSub(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addSub() }}
              placeholder="Add subtask..."
              style={{ flex: 1, padding: '5px 8px', fontSize: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', outline: 'none' }}
            />
            <button onClick={addSub} style={{ padding: '5px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Source meeting link */}
        {meeting && (
          <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(157,127,232,0.08)', border: '1px solid rgba(157,127,232,0.2)' }}>
            <p style={{ fontSize: 11, color: '#9d7fe8', marginBottom: 4, fontWeight: 600 }}>📋 From meeting</p>
            <button
              onClick={() => { setActiveMeeting(meeting.id); setRightPanel(true) }}
              style={{ fontSize: 12, color: '#9d7fe8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            >
              {meeting.title}
            </button>
          </div>
        )}

        {/* AI Assist */}
        <div className="flex flex-col gap-2">
          <button
            onClick={aiAssist}
            disabled={streaming}
            style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: 'rgba(157,127,232,0.12)', color: '#9d7fe8',
              border: '1px solid rgba(157,127,232,0.25)', cursor: streaming ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
              opacity: streaming ? 0.7 : 1,
            }}
          >
            <Sparkles size={14} /> {streaming ? 'Thinking…' : 'AI Assist'}
          </button>
          {aiText !== null && (
            <div style={{ padding: '10px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.65, background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
              {aiText || '…'}
              {streaming && <span className="streaming-cursor" />}
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={() => { deleteTask(task.id); setSelectedTask(null) }}
          style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 12,
            background: 'transparent', color: 'var(--accent-red)',
            border: '1px solid rgba(224,92,92,0.25)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <Trash2 size={13} /> Delete task
        </button>
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

const selectStyle = {
  width: '100%', padding: '6px 8px', fontSize: 12,
  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
  borderRadius: 6, color: 'var(--text-primary)', outline: 'none',
}
