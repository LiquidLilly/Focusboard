import { useState } from 'react'
import { format, isToday, isPast, parseISO } from 'date-fns'
import { Check, Plus, Trash2, Sparkles, ChevronDown, ChevronRight, X } from 'lucide-react'
import useStore from '../../store/useStore'
import { tomorrowISO, todayISO, formatPlannerDate } from '../../utils/dates'
import { callClaude, getApiKey } from '../../hooks/useAI'

export default function TomorrowPlanner() {
  const {
    planner, getPlannerDay, addPlannerSlot, updatePlannerSlot, deletePlannerSlot,
    getAllTasks, brainDump, showToast,
  } = useStore()

  const planDate    = tomorrowISO()
  const today       = todayISO()
  const slots       = getPlannerDay(planDate)
  const todaySlots  = getPlannerDay(today)

  // Show today's focus banner if there are slots for today
  const showTodayMode = todaySlots.length > 0

  const [addingIndex, setAddingIndex] = useState(null) // which slot# is being typed (0-4)
  const [draftText, setDraftText]     = useState('')
  const [editingSlotId, setEditingSlotId] = useState(null)
  const [editingText, setEditingText]  = useState('')
  const [suggestions, setSuggestions] = useState(null)
  const [suggesting, setSuggesting]   = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // ── Add slot ──────────────────────────────────────────────────────────────
  function confirmAdd() {
    const text = draftText.trim()
    if (!text) { setAddingIndex(null); return }
    const result = addPlannerSlot(planDate, { title: text })
    if (result) { setDraftText(''); setAddingIndex(null) }
  }

  // ── Edit slot inline ──────────────────────────────────────────────────────
  function startEdit(slot) {
    setEditingSlotId(slot.id); setEditingText(slot.title)
  }

  function confirmEdit() {
    if (editingText.trim()) updatePlannerSlot(planDate, editingSlotId, { title: editingText.trim() })
    setEditingSlotId(null); setEditingText('')
  }

  // ── Claude suggest ────────────────────────────────────────────────────────
  async function suggestWithClaude() {
    if (!getApiKey()) { showToast('Add an API key in Settings'); return }
    setSuggesting(true); setSuggestions(null)

    const tasks = getAllTasks()
      .filter(t => t.status !== 'done')
      .sort((a, b) => {
        const prio = { urgent: 0, high: 1, medium: 2, low: 3 }
        return (prio[a.priority] ?? 2) - (prio[b.priority] ?? 2)
      })
      .slice(0, 20)

    const flagged = brainDump.filter(i => i.important).slice(0, 5)

    const prompt = `Open tasks:
${tasks.map(t => `- "${t.title}" [${t.priority}, ${t.status}${t.dueDate ? `, due ${t.dueDate}` : ''}] in ${t.bucketName}`).join('\n')}

${flagged.length ? `Flagged brain dump items:\n${flagged.map(i => `- "${i.text}"`).join('\n')}` : ''}

Given these, suggest the 3–5 most important things this person should focus on tomorrow. Prioritize by urgency, due date proximity, and anything flagged as important. Be specific and direct.

Return ONLY a JSON array (no markdown) like:
[{"title": "...", "bucketName": "...", "reason": "one sentence"}]
Max 5 items.`

    try {
      const raw  = await callClaude(prompt)
      const trimmed = raw.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
      setSuggestions(JSON.parse(trimmed))
    } catch (e) {
      showToast(`Suggestion failed: ${e.message}`)
    } finally {
      setSuggesting(false)
    }
  }

  function addSuggestion(s) {
    const ok = addPlannerSlot(planDate, { title: s.title, bucketName: s.bucketName })
    if (ok) {
      setSuggestions(prev => prev?.filter(x => x.title !== s.title))
    }
  }

  // ── History ───────────────────────────────────────────────────────────────
  const historyDates = Object.keys(planner)
    .filter(d => d !== planDate && d !== today)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 10)

  const filledCount = slots.filter(s => s.title).length

  return (
    <div className="flex-1 overflow-y-auto flex flex-col items-center py-10 px-4">
      {/* Today mode banner */}
      {showTodayMode && (
        <TodayFocusCard date={today} slots={todaySlots} />
      )}

      {/* Main planner card */}
      <div
        className="w-full max-w-xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 28 }}
      >
        {/* Header */}
        <div className="flex flex-col gap-1 mb-6">
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-primary)', fontWeight: 600 }}>
            Tomorrow — {formatPlannerDate(planDate)}
          </span>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>What matters most?</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Pick up to 5 things. The rest can wait.</p>
        </div>

        {/* Slots */}
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, i) => {
            const slot = slots[i]
            const num  = String(i + 1).padStart(2, '0')

            if (!slot && addingIndex !== i) {
              // Empty slot — click to add
              return (
                <EmptySlot key={i} num={num} onClick={() => { setAddingIndex(i); setDraftText('') }} disabled={filledCount >= 5} />
              )
            }

            if (!slot && addingIndex === i) {
              // Typing into empty slot
              return (
                <AddingSlot key={i} num={num} value={draftText} onChange={setDraftText}
                  onConfirm={confirmAdd} onCancel={() => setAddingIndex(null)} />
              )
            }

            // Filled slot
            if (editingSlotId === slot.id) {
              return (
                <AddingSlot key={slot.id} num={num} value={editingText} onChange={setEditingText}
                  onConfirm={confirmEdit} onCancel={() => setEditingSlotId(null)} />
              )
            }

            return (
              <FilledSlot
                key={slot.id} num={num} slot={slot}
                onToggle={() => updatePlannerSlot(planDate, slot.id, { done: !slot.done })}
                onEdit={() => startEdit(slot)}
                onDelete={() => deletePlannerSlot(planDate, slot.id)}
                onToggleImportant={() => updatePlannerSlot(planDate, slot.id, { important: !slot.important })}
              />
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-5">
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filledCount} of 5 slots filled</span>
          <button
            onClick={suggestWithClaude}
            disabled={suggesting || filledCount >= 5}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              background: 'transparent', color: 'var(--accent-primary)',
              border: '1px solid var(--accent-primary)', cursor: suggesting ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: suggesting || filledCount >= 5 ? 0.5 : 1,
            }}
          >
            <Sparkles size={13} /> {suggesting ? 'Thinking…' : 'Suggest with Claude'}
          </button>
        </div>

        {/* Suggestions drawer */}
        {suggestions && suggestions.length > 0 && (
          <div className="mt-4 flex flex-col gap-2" style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-default)' }}>
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Suggestions</span>
              <button onClick={() => setSuggestions(null)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}><X size={13} /></button>
            </div>
            {suggestions.map((s, i) => (
              <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 3 }}>{s.title}</p>
                {s.bucketName && <p style={{ fontSize: 11, color: 'var(--accent-primary)', marginBottom: 4 }}>{s.bucketName}</p>}
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>{s.reason}</p>
                <button
                  onClick={() => addSuggestion(s)}
                  disabled={filledCount >= 5}
                  style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(72,185,199,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(72,185,199,0.2)', borderRadius: 6, cursor: 'pointer' }}
                >
                  + Add to slot
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past plans */}
      {historyDates.length > 0 && (
        <div className="w-full max-w-xl mt-4">
          <button
            onClick={() => setShowHistory(v => !v)}
            style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {showHistory ? <ChevronDown size={13} /> : <ChevronRight size={13} />} Past plans
          </button>
          {showHistory && (
            <div className="flex flex-col gap-2 mt-3">
              {historyDates.map(d => <HistoryRow key={d} date={d} slots={planner[d] || []} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function EmptySlot({ num, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
        background: 'var(--bg-elevated)', border: '1px dashed var(--border-default)',
        borderRadius: 10, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1,
        width: '100%', textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', width: 20, flexShrink: 0 }}>{num}</span>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Add something…</span>
    </button>
  )
}

function AddingSlot({ num, value, onChange, onConfirm, onCancel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-accent)', borderRadius: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)', width: 20, flexShrink: 0 }}>{num}</span>
      <input
        autoFocus
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onConfirm(); if (e.key === 'Escape') onCancel() }}
        placeholder="What do you want to focus on?"
        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)' }}
      />
      <button onClick={onConfirm} style={{ color: 'var(--accent-green)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}><Check size={14} /></button>
      <button onClick={onCancel} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}><X size={13} /></button>
    </div>
  )
}

function FilledSlot({ num, slot, onToggle, onEdit, onDelete, onToggleImportant }) {
  return (
    <div
      className="group"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
        background: slot.important ? '#1f1e16' : 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderLeft: slot.important ? '3px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
        borderRadius: 10,
      }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        style={{
          width: 18, height: 18, borderRadius: '50%', flexShrink: 0, cursor: 'pointer', marginTop: 1,
          border: `2px solid ${slot.done ? 'var(--accent-green)' : slot.important ? 'var(--accent-orange)' : 'var(--border-default)'}`,
          background: slot.done ? 'var(--accent-green)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {slot.done && <Check size={10} color="#0d1117" />}
      </button>

      {/* Number + content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: slot.important ? 'var(--accent-orange)' : 'var(--text-muted)', marginRight: 8 }}>{num}</span>
        <span
          style={{
            fontSize: 13, fontWeight: 500, color: slot.done ? 'var(--text-muted)' : 'var(--text-primary)',
            textDecoration: slot.done ? 'line-through' : 'none', cursor: 'text',
          }}
          onClick={onEdit}
        >
          {slot.title}
        </span>
        {slot.bucketName && (
          <span style={{ marginLeft: 8, fontSize: 10, background: 'rgba(72,185,199,0.1)', color: 'var(--accent-primary)', padding: '1px 7px', borderRadius: 999 }}>{slot.bucketName}</span>
        )}
        {slot.timeContext && (
          <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text-muted)' }}>{slot.timeContext}</span>
        )}
      </div>

      {/* Actions (hover) */}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1" style={{ transition: 'opacity 0.15s' }}>
        <IconBtn icon="⚡" title="Toggle important" onClick={onToggleImportant} color={slot.important ? 'var(--accent-orange)' : undefined} />
        <IconBtn icon={<Trash2 size={11} />} title="Remove slot" onClick={onDelete} color="var(--accent-red)" />
      </div>
    </div>
  )
}

function TodayFocusCard({ date, slots }) {
  const { updatePlannerSlot } = useStore()
  const done = slots.filter(s => s.done).length

  return (
    <div className="w-full max-w-xl mb-6 p-4 rounded-xl" style={{ background: 'rgba(72,185,199,0.07)', border: '1px solid rgba(72,185,199,0.2)' }}>
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-primary)', fontWeight: 600 }}>
          Today's focus — {formatPlannerDate(date)}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{done}/{slots.length} done</span>
      </div>
      <div className="flex flex-col gap-2">
        {slots.map(slot => (
          <div key={slot.id} className="flex items-center gap-3">
            <button
              onClick={() => updatePlannerSlot(date, slot.id, { done: !slot.done })}
              style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                border: `2px solid ${slot.done ? 'var(--accent-green)' : 'var(--border-default)'}`,
                background: slot.done ? 'var(--accent-green)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {slot.done && <Check size={9} color="#0d1117" />}
            </button>
            <span style={{ fontSize: 12, color: slot.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: slot.done ? 'line-through' : 'none' }}>{slot.title}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HistoryRow({ date, slots }) {
  const [open, setOpen] = useState(false)
  const done  = slots.filter(s => s.done).length
  const total = slots.length
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatPlannerDate(date)}</span>
        <span style={{ fontSize: 11, color: done === total ? 'var(--accent-green)' : 'var(--text-muted)' }}>{done}/{total} done</span>
      </button>
      {open && (
        <div className="px-4 pb-3 flex flex-col gap-1">
          {slots.map(slot => (
            <div key={slot.id} className="flex items-center gap-2">
              <span style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0, background: slot.done ? 'var(--accent-green)' : 'var(--border-default)', display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: slot.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: slot.done ? 'line-through' : 'none' }}>{slot.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function IconBtn({ icon, onClick, color, title }) {
  return (
    <button onClick={onClick} title={title} style={{ color: color || 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', fontSize: 12 }}>
      {icon}
    </button>
  )
}
