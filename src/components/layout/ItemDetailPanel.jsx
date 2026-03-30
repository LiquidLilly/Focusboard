import { useState, useEffect, useRef } from 'react'
import useStore from '../../store/useStore'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Select, Textarea } from '../ui/Input'
import { MarkdownRenderer } from '../ui/MarkdownRenderer'
import { callClaudeStream, getApiKey } from '../../hooks/useAI'
import { getDueDateColor, formatFullDate, isOverdue, isDueSoon } from '../../utils/dates'
import { X, Plus, Trash2, Sparkles, Check } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const TYPE_OPTIONS = [
  { value: 'task', label: 'Task' },
  { value: 'todo', label: 'To-Do' },
  { value: 'goal', label: 'Goal' },
]

export function ItemDetailPanel() {
  const { selectedItemId, setSelectedItemId, getItem, updateItem, addSubtask, toggleSubtask, deleteSubtask, deleteItem } = useStore()
  const item = selectedItemId ? getItem(selectedItemId) : null

  const [newSubtask, setNewSubtask] = useState('')
  const [aiOutput, setAiOutput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [titleEditing, setTitleEditing] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const titleRef = useRef(null)

  useEffect(() => {
    if (item) {
      setTitleValue(item.title)
      setAiOutput('')
    }
  }, [selectedItemId])

  if (!item) return null

  function handleUpdate(field, value) {
    updateItem(item.id, { [field]: value })
  }

  function handleDelete() {
    setSelectedItemId(null)
    deleteItem(item.id)
  }

  function handleAddSubtask(e) {
    e.preventDefault()
    if (!newSubtask.trim()) return
    addSubtask(item.id, newSubtask.trim())
    setNewSubtask('')
  }

  async function handleAiAssist() {
    if (!getApiKey()) {
      setAiOutput('⚠ No API key set. Go to Settings to add your Claude API key.')
      return
    }
    setAiLoading(true)
    setAiOutput('')

    const subtaskList = item.subtasks.length > 0
      ? item.subtasks.map(s => `- [${s.done ? 'x' : ' '}] ${s.title}`).join('\n')
      : 'None defined'

    const prompt = `Review this task and help me think through it:

**Title:** ${item.title}
**Type:** ${item.type}
**Status:** ${item.status}
**Priority:** ${item.priority}
**Due:** ${item.dueDate ? formatFullDate(item.dueDate) : 'Not set'}
**Notes:** ${item.description || 'None'}
**Subtasks:**
${subtaskList}

Please:
1. **What's missing** — what info or subtasks would help me actually do this?
2. **Next actions** — the 2-3 most concrete next moves
3. **Risks** — anything that could block or delay this
4. **Improved description** — rewrite the description if it's vague or unclear (only if needed)

Be specific and direct. This person has ADHD and benefits from concrete, step-level guidance.`

    try {
      await callClaudeStream(prompt, (chunk, full) => {
        setAiOutput(full)
      })
    } catch (err) {
      setAiOutput(`Error: ${err.message}`)
    } finally {
      setAiLoading(false)
    }
  }

  const overdue = isOverdue(item.dueDate)
  const dueSoon = isDueSoon(item.dueDate)
  const borderColor = overdue ? 'border-l-4 border-l-red-500' : dueSoon ? 'border-l-4 border-l-amber-400' : ''

  return (
    <div className="w-96 flex-shrink-0 border-l border-warm-gray bg-parchment flex flex-col h-full overflow-hidden font-mono">
      {/* Header */}
      <div className={`flex items-start justify-between px-4 py-3 border-b border-warm-gray ${borderColor}`}>
        <div className="flex-1 min-w-0">
          {titleEditing ? (
            <input
              ref={titleRef}
              autoFocus
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onBlur={() => { handleUpdate('title', titleValue); setTitleEditing(false) }}
              onKeyDown={e => {
                if (e.key === 'Enter') { handleUpdate('title', titleValue); setTitleEditing(false) }
                if (e.key === 'Escape') { setTitleValue(item.title); setTitleEditing(false) }
              }}
              className="w-full font-mono font-semibold text-base bg-transparent border-b border-charcoal outline-none text-charcoal"
            />
          ) : (
            <h2
              className="font-semibold text-base text-charcoal cursor-text hover:text-stone-600"
              onClick={() => setTitleEditing(true)}
              title="Click to edit"
            >
              {item.title}
            </h2>
          )}
          <div className="flex gap-1.5 mt-1 flex-wrap">
            <Badge variant={item.type}>{item.type}</Badge>
            <Badge variant={item.priority}>{item.priority}</Badge>
            {overdue && <Badge variant="urgent">overdue</Badge>}
            {dueSoon && !overdue && <Badge variant="high">due soon</Badge>}
          </div>
        </div>
        <button onClick={() => setSelectedItemId(null)} className="text-stone-400 hover:text-charcoal ml-2 mt-0.5">
          <X size={16} />
        </button>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
        {/* Status + Priority */}
        <div className="grid grid-cols-2 gap-2">
          <Select
            label="Status"
            value={item.status}
            onChange={e => handleUpdate('status', e.target.value)}
            options={STATUS_OPTIONS}
          />
          <Select
            label="Priority"
            value={item.priority}
            onChange={e => handleUpdate('priority', e.target.value)}
            options={PRIORITY_OPTIONS}
          />
        </div>

        {/* Type */}
        <Select
          label="Type"
          value={item.type}
          onChange={e => handleUpdate('type', e.target.value)}
          options={TYPE_OPTIONS}
        />

        {/* Due Date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-stone-500 uppercase tracking-wide">Due Date</label>
          <input
            type="date"
            value={item.dueDate || ''}
            onChange={e => handleUpdate('dueDate', e.target.value || null)}
            className="font-mono text-sm border border-warm-gray bg-parchment px-2.5 py-1.5 text-charcoal focus:outline-none focus:border-charcoal"
          />
          {item.dueDate && (
            <span className={`text-xs ${getDueDateColor(item.dueDate)}`}>
              {formatFullDate(item.dueDate)}
            </span>
          )}
        </div>

        {/* Assignee */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-stone-500 uppercase tracking-wide">Assignee</label>
          <input
            type="text"
            value={item.assignee || ''}
            onChange={e => handleUpdate('assignee', e.target.value)}
            placeholder="Who owns this?"
            className="font-mono text-sm border border-warm-gray bg-parchment px-2.5 py-1.5 text-charcoal focus:outline-none focus:border-charcoal"
          />
        </div>

        {/* Goal Progress */}
        {item.type === 'goal' && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-stone-500 uppercase tracking-wide">Progress — {item.progress}%</label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={item.progress}
              onChange={e => handleUpdate('progress', parseInt(e.target.value))}
              className="w-full accent-stone-600"
            />
            <div className="h-1.5 bg-warm-gray">
              <div className="h-full bg-stone-600 transition-all" style={{ width: `${item.progress}%` }} />
            </div>
          </div>
        )}

        {/* Notes */}
        <Textarea
          label="Notes"
          value={item.description || ''}
          onChange={e => handleUpdate('description', e.target.value)}
          placeholder="Add context, links, or anything useful…"
          rows={4}
        />

        {/* Subtasks */}
        {(item.type === 'task' || item.type === 'goal') && (
          <div className="flex flex-col gap-2">
            <label className="text-xs text-stone-500 uppercase tracking-wide">Subtasks</label>
            {item.subtasks.length === 0 && (
              <p className="text-xs text-stone-400 italic">No subtasks yet. Break it down.</p>
            )}
            {item.subtasks.map(sub => (
              <div key={sub.id} className="flex items-center gap-2 group">
                <button
                  onClick={() => toggleSubtask(item.id, sub.id)}
                  className={`w-4 h-4 border shrink-0 flex items-center justify-center transition-colors
                    ${sub.done ? 'bg-charcoal border-charcoal' : 'border-warm-gray hover:border-charcoal'}`}
                >
                  {sub.done && <Check size={10} className="text-parchment" />}
                </button>
                <span className={`flex-1 text-xs ${sub.done ? 'line-through text-stone-400' : 'text-charcoal'}`}>
                  {sub.title}
                </span>
                <button
                  onClick={() => deleteSubtask(item.id, sub.id)}
                  className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
            <form onSubmit={handleAddSubtask} className="flex gap-1.5">
              <input
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                placeholder="Add a subtask…"
                className="flex-1 font-mono text-xs border border-warm-gray bg-parchment px-2 py-1 text-charcoal focus:outline-none focus:border-charcoal"
              />
              <button type="submit" className="text-stone-400 hover:text-charcoal border border-warm-gray px-2 hover:border-charcoal">
                <Plus size={12} />
              </button>
            </form>
          </div>
        )}

        {/* AI Assist */}
        <div className="border border-warm-gray p-3 bg-stone-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">AI Assist</span>
            <Button
              size="xs"
              variant="default"
              onClick={handleAiAssist}
              disabled={aiLoading}
            >
              <Sparkles size={11} />
              {aiLoading ? 'Thinking…' : 'Analyze'}
            </Button>
          </div>
          {aiOutput ? (
            <div className="max-h-64 overflow-y-auto">
              <MarkdownRenderer content={aiOutput} className="text-xs" />
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic">
              {getApiKey() ? 'Click Analyze to get AI suggestions for this item.' : 'Add your API key in Settings to use AI features.'}
            </p>
          )}
        </div>

        {/* Delete */}
        <div className="pt-2 border-t border-warm-gray">
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 size={12} />
            Delete Item
          </Button>
        </div>
      </div>
    </div>
  )
}
