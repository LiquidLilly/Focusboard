import { useState, useEffect, useRef } from 'react'
import { X, Star, Plus, Trash2, Check, Sparkles, HelpCircle } from 'lucide-react'
import useStore from '../../store/useStore'
import { formatDueDate, isOverdue, isDueSoon } from '../../utils/dates'
import { callAIStream, BASE_SYSTEM_PROMPT } from '../../hooks/useAI'

const STATUS_OPTIONS   = ['backlog', 'todo', 'in-progress', 'done']
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent']

export default function TaskDetailPanel() {
  const {
    selectedTaskId, setSelectedTask,
    getTask, getTaskBucket,
    updateTask, deleteTask,
    addSubtask, toggleSubtask, deleteSubtask,
    showToast,
  } = useStore()

  const task   = getTask(selectedTaskId)
  const bucket = getTaskBucket(selectedTaskId)

  const [newSub, setNewSub]         = useState('')
  const [aiText, setAiText]         = useState(null)
  const [streaming, setStreaming]   = useState(false)
  const [clarityText, setClarityText] = useState('')
  const [clarityResult, setClarityResult] = useState(null)
  const [clarityStreaming, setClarityStreaming] = useState(false)
  const panelRef = useRef()

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setSelectedTask(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setSelectedTask])

  useEffect(() => {
    function onClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setSelectedTask(null)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [setSelectedTask])

  if (!task) return null

  const overdue = isOverdue(task.dueDate)
  const dueSoon = isDueSoon(task.dueDate)

  function update(field, value) { updateTask(task.id, { [field]: value }) }

  function addSub() {
    const t = newSub.trim()
    if (!t) return
    addSubtask(task.id, t)
    setNewSub('')
  }

  async function aiAssist() {
    setStreaming(true)
    setAiText('')
    const subtaskList = task.subtasks?.length
      ? `\nSubtasks: ${task.subtasks.map(s => `${s.done ? '✓' : '○'} ${s.title}`).join(', ')}`
      : ''
    try {
      await callAIStream(
        `Task: "${task.title}"\nBucket: ${bucket?.name || 'unknown'}\nStatus: ${task.status}\nPriority: ${task.priority}${task.dueDate ? `\nDue: ${task.dueDate}` : ''}${subtaskList}\n\nSurface what's missing, suggest next steps, and flag any risks. Be specific and direct.`,
        (_, full) => setAiText(full),
        BASE_SYSTEM_PROMPT,
      )
    } catch (e) {
      setAiText(`Error: ${e.message}`)
    } finally {
      setStreaming(false)
    }
  }

  async function runClarityCheck() {
    if (!clarityText.trim()) return
    setClarityStreaming(true)
    setClarityResult('')
    try {
      await callAIStream(
        `I've been asked to do the following:\n\n${clarityText}\n\nRespond with:\n1. "Here's what I think is being asked of you" — brief, specific\n2. "Questions worth asking before you go further" — 2-3 questions\n3. "What success probably looks like" — one sentence`,
        (_, full) => setClarityResult(full),
        BASE_SYSTEM_PROMPT,
      )
    } catch (e) {
      setClarityResult(`Error: ${e.message}`)
    } finally {
      setClarityStreaming(false)
    }
  }

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: 420, zIndex: 30,
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-default)',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, marginRight: 12 }}>
          <input
            value={task.title}
            onChange={e => update('title', e.target.value)}
            style={{ fontSize: 15, fontWeight: 500, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%' }}
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{bucket?.name}</span>
        </div>
        <button onClick={() => setSelectedTask(null)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', padding: 4, cursor: 'pointer', flexShrink: 0 }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 16 }}>
        {/* Meta fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
              style={{ ...selectStyle, color: overdue ? 'var(--accent-red)' : dueSoon ? 'var(--accent-warm)' : 'var(--text-primary)' }}
            />
          </Field>
          <Field label="Important">
            <button
              onClick={() => update('important', !task.important)}
              style={{
                padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                background: task.important ? 'rgba(232,164,74,0.15)' : 'var(--bg-raised)',
                color: task.important ? 'var(--accent-warm)' : 'var(--text-muted)',
                border: `1px solid ${task.important ? 'var(--accent-warm)' : 'var(--border-default)'}`,
              }}
            >
              <Star size={12} fill={task.important ? 'var(--accent-warm)' : 'none'} style={{ display: 'inline', marginRight: 4 }} />
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
            Subtasks ({task.subtasks?.filter(s => s.done).length || 0}/{task.subtasks?.length || 0})
          </label>
          {task.subtasks?.map(sub => (
            <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="group">
              <button
                onClick={() => toggleSubtask(task.id, sub.id)}
                style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
                  border: `1.5px solid ${sub.done ? 'var(--accent-green)' : 'var(--border-default)'}`,
                  background: sub.done ? 'var(--accent-green)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {sub.done && <Check size={10} color="var(--text-inverse)" />}
              </button>
              <span style={{ flex: 1, fontSize: 13, color: sub.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: sub.done ? 'line-through' : 'none' }}>{sub.title}</span>
              <button onClick={() => deleteSubtask(task.id, sub.id)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: 0 }} className="group-hover:opacity-100">
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={newSub}
              onChange={e => setNewSub(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addSub() }}
              placeholder="Add subtask..."
              style={{ flex: 1, padding: '5px 8px', fontSize: 12, background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', outline: 'none' }}
            />
            <button onClick={addSub} style={{ padding: '5px 10px', background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Clarity Check */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <HelpCircle size={12} /> Clarity Check
          </label>
          <textarea
            value={clarityText}
            onChange={e => setClarityText(e.target.value)}
            placeholder="Paste what you've been asked to do..."
            rows={3}
            style={{ ...selectStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
          <button
            onClick={runClarityCheck}
            disabled={!clarityText.trim() || clarityStreaming}
            style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: 'rgba(91,156,246,0.12)', color: 'var(--accent)',
              border: '1px solid rgba(91,156,246,0.25)',
              cursor: (!clarityText.trim() || clarityStreaming) ? 'default' : 'pointer',
              opacity: !clarityText.trim() ? 0.5 : 1,
            }}
          >
            {clarityStreaming ? 'Thinking…' : 'Check clarity'}
          </button>
          {clarityResult !== null && (
            <div style={{ padding: '10px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.7, background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
              {clarityResult || '…'}
              {clarityStreaming && <span className="streaming-cursor" />}
            </div>
          )}
        </div>

        {/* AI Assist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={aiAssist}
            disabled={streaming}
            style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: 'rgba(157,127,232,0.12)', color: 'var(--accent-purple)',
              border: '1px solid rgba(157,127,232,0.25)',
              cursor: streaming ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
              opacity: streaming ? 0.7 : 1,
            }}
          >
            <Sparkles size={14} /> {streaming ? 'Thinking…' : 'AI Assist'}
          </button>
          {aiText !== null && (
            <div style={{ padding: '10px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.7, background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  )
}

const selectStyle = {
  width: '100%', padding: '6px 8px', fontSize: 12,
  background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
  borderRadius: 6, color: 'var(--text-primary)', outline: 'none',
}
