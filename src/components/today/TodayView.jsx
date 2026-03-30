import { useState, useEffect } from 'react'
import useStore from '../../store/useStore'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { MarkdownRenderer } from '../ui/MarkdownRenderer'
import { callClaudeStream, getApiKey } from '../../hooks/useAI'
import { isToday, isPast, parseISO, format } from 'date-fns'
import { isOverdue, isDueSoon, formatDueDate, getDueDateColor } from '../../utils/dates'
import { Check, ChevronDown, ChevronUp, Zap, Calendar, Pin } from 'lucide-react'

export function TodayView() {
  const { getAllItems, updateItem, setSelectedItemId, settings } = useStore()
  const [focusPrompt, setFocusPrompt] = useState('')
  const [promptLoading, setPromptLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const allItems = getAllItems()

  // Items for today: overdue, due today, or pinned
  const todayItems = allItems.filter(item => {
    if (item.status === 'done') return false
    if (item.pinnedToday) return true
    if (item.dueDate) {
      const d = parseISO(item.dueDate)
      return isToday(d) || isPast(d)
    }
    return false
  })

  // Sort by urgency: overdue first, then by priority
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
  const sorted = [...todayItems].sort((a, b) => {
    const aOver = isOverdue(a.dueDate) ? 0 : 1
    const bOver = isOverdue(b.dueDate) ? 0 : 1
    if (aOver !== bOver) return aOver - bOver
    return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
  })

  const displayed = showAll ? sorted : sorted.slice(0, 5)
  const hidden = sorted.length - 5

  useEffect(() => {
    if (settings.apiKey && sorted.length > 0 && !focusPrompt && !promptLoading) {
      generateFocusPrompt()
    }
  }, [settings.apiKey])

  async function generateFocusPrompt() {
    if (!getApiKey()) return
    setPromptLoading(true)
    const itemSummary = sorted.slice(0, 5).map(i =>
      `- ${i.title} (${i.priority} priority${isOverdue(i.dueDate) ? ', OVERDUE' : ''})`
    ).join('\n')

    const prompt = `Here are the user's most urgent tasks for today:
${itemSummary}

Write ONE calm, grounding, direct sentence to focus them. Like a trusted coach — specific about the most important thing to tackle. Under 120 characters. No preamble, just the sentence.

Example style: "Your most important move today is finishing the board slides — everything else can wait."`

    try {
      const text = await callClaudeStream(prompt, (chunk, full) => {
        setFocusPrompt(full.replace(/^["']|["']$/g, ''))
      })
    } catch {
      setFocusPrompt('')
    } finally {
      setPromptLoading(false)
    }
  }

  function handleToggleDone(item) {
    const newStatus = item.status === 'done' ? 'todo' : 'done'
    updateItem(item.id, { status: newStatus })
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 font-mono bg-[#080808]">
      <div className="max-w-2xl mx-auto">
        {/* Date header */}
        <div className="mb-6">
          <div className="text-xs text-[#cccccc] uppercase tracking-widest">{format(new Date(), 'EEEE, MMMM d')}</div>
          <h1 className="text-xl font-bold text-[#00fff7] mt-0.5 uppercase tracking-widest">Today</h1>
        </div>

        {/* Focus prompt */}
        {(focusPrompt || promptLoading) && (
          <div className="border-l-4 border-l-[#ffd000] bg-[#ffd00015] border border-[#ffd000] px-4 py-3 mb-6">
            {promptLoading ? (
              <span className="text-sm text-[#ffd000] italic font-bold">Getting your focus directive…</span>
            ) : (
              <p className="text-sm text-[#ffd000] font-bold leading-relaxed">"{focusPrompt}"</p>
            )}
          </div>
        )}

        {!settings.apiKey && (
          <div className="border border-[#444466] bg-[#111118] px-4 py-3 mb-6">
            <p className="text-xs text-[#cccccc]">Add your Claude API key in Settings to get a personalized daily focus directive.</p>
          </div>
        )}

        {/* Item list */}
        {sorted.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3 opacity-30">✓</div>
            <p className="text-[#cccccc] text-sm">Nothing due today. Clear schedule.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {displayed.map(item => {
              const overdue = isOverdue(item.dueDate)
              const dueSoon = isDueSoon(item.dueDate)
              const borderL = overdue ? 'border-l-[#ff3333]' : dueSoon ? 'border-l-[#ffd000]' : 'border-l-[#444466]'

              return (
                <div
                  key={item.id}
                  className={`bg-[#111118] border border-[#444466] border-l-4 flex items-start gap-3 p-3 ${borderL}`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleDone(item)}
                    className={`mt-0.5 w-5 h-5 border shrink-0 flex items-center justify-center transition-colors
                      ${item.status === 'done' ? 'bg-[#00fff7] border-[#00fff7]' : 'border-[#444466] hover:border-[#00fff7]'}`}
                  >
                    {item.status === 'done' && <Check size={12} className="text-[#080808]" />}
                  </button>

                  {/* Content */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setSelectedItemId(item.id)}
                  >
                    <div className={`text-sm font-bold ${item.status === 'done' ? 'line-through text-[#666688]' : 'text-[#ffffff]'}`}>
                      {item.title}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1 items-center">
                      <span className="text-xs text-[#cccccc]">{item.projectName}</span>
                      <Badge variant={item.type}>{item.type}</Badge>
                      <Badge variant={item.priority}>{item.priority}</Badge>
                      {item.dueDate && (
                        <span className={`text-xs flex items-center gap-0.5 font-bold ${overdue ? 'text-[#ff3333]' : dueSoon ? 'text-[#ffd000]' : 'text-[#cccccc]'}`}>
                          <Calendar size={10} />
                          {overdue ? `Overdue (${formatDueDate(item.dueDate)})` : formatDueDate(item.dueDate)}
                        </span>
                      )}
                      {item.pinnedToday && <span className="text-xs text-[#cccccc] flex items-center gap-0.5"><Pin size={10} /> pinned</span>}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Show more/less */}
            {sorted.length > 5 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex items-center gap-1.5 text-xs font-mono text-[#cccccc] hover:text-[#ffffff] py-2 px-1"
              >
                {showAll ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show {hidden} more</>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
