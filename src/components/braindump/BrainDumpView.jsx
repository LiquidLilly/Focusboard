import { useState, useRef, useEffect } from 'react'
import useStore from '../../store/useStore'
import { callClaude, getApiKey } from '../../hooks/useAI'
import { Zap, ArrowRight, Check, Archive, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'

// Priority config — colors match the cyber palette
const PRIORITIES = [
  { value: 'critical', label: 'CRIT',   border: 'border-l-[#ff2020]', text: 'text-[#ff2020]',  bg: 'bg-[#ff202015]' },
  { value: 'high',     label: 'HIGH',   border: 'border-l-[#ff00ff]', text: 'text-[#ff00ff]',  bg: 'bg-[#ff00ff10]' },
  { value: 'normal',   label: 'NRML',   border: 'border-l-[#00fff7]', text: 'text-[#00fff7]',  bg: ''               },
  { value: 'low',      label: 'LOW',    border: 'border-l-[#444466]', text: 'text-[#444466]',  bg: ''               },
]

function getPriority(value) {
  return PRIORITIES.find(p => p.value === value) || PRIORITIES[2]
}

function formatTs(iso) {
  try { return format(new Date(iso), 'MMM d HH:mm') } catch { return '' }
}

export function BrainDumpView() {
  const {
    brainDump, projects,
    addBrainDumpItem, deleteBrainDumpItem,
    updateBrainDumpItem, promoteBrainDumpItem, archiveBrainDumpItem,
    addItem, setSelectedItemId,
  } = useStore()

  const [inputValue, setInputValue]   = useState('')
  const [inputPriority, setInputPriority] = useState('normal')
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [promotingId, setPromotingId] = useState(null)   // id being promoted
  const [sortingId, setSortingId]     = useState(null)
  const [sortResult, setSortResult]   = useState({})
  const [showArchived, setShowArchived] = useState(false)
  const inputRef = useRef(null)
  const listRef  = useRef(null)

  // N — focus capture input
  useEffect(() => {
    function handleKey(e) {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        inputRef.current?.focus()
        return
      }

      // P — promote selected
      if ((e.key === 'p' || e.key === 'P') && selectedIdx !== null) {
        const active = visibleItems[selectedIdx]
        if (active && !active.promoted && !active.archived) {
          setPromotingId(active.id)
        }
        return
      }

      // X — archive selected
      if ((e.key === 'x' || e.key === 'X') && selectedIdx !== null) {
        const active = visibleItems[selectedIdx]
        if (active && !active.archived) {
          archiveBrainDumpItem(active.id)
          setSelectedIdx(null)
        }
        return
      }

      // Arrow navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx(i => i === null ? 0 : Math.min(i + 1, visibleItems.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx(i => i === null ? 0 : Math.max(i - 1, 0))
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedIdx, brainDump, showArchived])

  function handleCapture(e) {
    e.preventDefault()
    if (!inputValue.trim()) return
    addBrainDumpItem(inputValue.trim(), inputPriority)
    setInputValue('')
    setInputPriority('normal')
    setSelectedIdx(0) // select the newly created (top) item
  }

  async function handleSort(item) {
    if (!getApiKey()) {
      setSortResult(r => ({ ...r, [item.id]: { error: 'No API key — add one in Settings.' } }))
      return
    }
    setSortingId(item.id)
    const projectList = projects.map(p => ({
      name: p.name,
      buckets: p.buckets.map(b => b.name).join(', '),
    }))
    const prompt = `I captured this in my brain dump: "${item.text}"

My projects are:
${projectList.map(p => `- ${p.name} (buckets: ${p.buckets})`).join('\n')}

Suggest:
1. Which project it belongs to (just the name, or "New Project" if none fit)
2. Which bucket (e.g., "Next Up", "Backlog")
3. What type: task, todo, or goal
4. A cleaner, clearer title (under 80 chars)

Reply in this exact format:
Project: [name]
Bucket: [name]
Type: [task|todo|goal]
Title: [cleaned title]`

    try {
      const response = await callClaude(prompt)
      const lines = response.split('\n').filter(l => l.includes(':'))
      const parsed = {}
      for (const line of lines) {
        const [key, ...rest] = line.split(':')
        parsed[key.trim().toLowerCase()] = rest.join(':').trim()
      }
      setSortResult(r => ({ ...r, [item.id]: parsed }))
    } catch (err) {
      setSortResult(r => ({ ...r, [item.id]: { error: err.message } }))
    } finally {
      setSortingId(null)
    }
  }

  function handleConfirmSort(item) {
    const result = sortResult[item.id]
    if (!result || result.error) return
    const project = projects.find(p => p.name.toLowerCase() === result.project?.toLowerCase()) || projects[0]
    if (!project) return
    const bucket = project.buckets.find(b => b.name.toLowerCase() === result.bucket?.toLowerCase()) || project.buckets[0]
    if (!bucket) return
    const type = ['task', 'todo', 'goal'].includes(result.type) ? result.type : 'task'
    const itemId = addItem(project.id, bucket.id, { title: result.title || item.text, type, description: item.text })
    updateBrainDumpItem(item.id, { promoted: true })
    setSortResult(r => { const c = { ...r }; delete c[item.id]; return c })
    setSelectedItemId(itemId)
  }

  const activeItems   = brainDump.filter(i => !i.archived && !i.promoted)
  const promotedItems = brainDump.filter(i => i.promoted)
  const archivedItems = brainDump.filter(i => i.archived)
  const visibleItems  = showArchived ? brainDump : [...activeItems, ...promotedItems]

  return (
    <div className="flex-1 overflow-hidden flex flex-col h-full font-mono bg-[#0d0d0d]">
      {/* ── Capture bar ── pinned at top */}
      <div className="shrink-0 border-b border-[#1e1e3a] bg-[#0d0d0d] px-6 py-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-[#00fff7]" />
            <span className="text-sm font-bold text-[#00fff7] tracking-widest uppercase">Brain Dump</span>
            <span className="text-xs text-[#444466] ml-2">Press N to focus · P promote · X archive · ↑↓ navigate</span>
          </div>

          {/* Input row */}
          <form onSubmit={handleCapture} className="flex gap-2">
            {/* Priority selector */}
            <div className="flex gap-0.5 shrink-0">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setInputPriority(p.value)}
                  className={`text-xs px-2 py-2 border transition-colors
                    ${inputPriority === p.value
                      ? `border-current ${p.text} bg-current/10`
                      : 'border-[#1e1e3a] text-[#444466] hover:border-[#444466]'
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="What's on your mind? Enter to capture…"
              autoFocus
              className="flex-1 bg-[#1a1a2e] border border-[#1e1e3a] text-[#e0e0e0] placeholder-[#444466]
                         px-3 py-2 text-sm focus:outline-none focus:border-[#00fff7]"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="bg-[#00fff7] text-[#0d0d0d] font-bold text-sm px-4 py-2
                         hover:bg-[#00fff7cc] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              CAPTURE
            </button>
          </form>
        </div>
      </div>

      {/* ── Card list ── scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-2">
          {activeItems.length === 0 && promotedItems.length === 0 && !showArchived && (
            <div className="text-center py-16 text-[#444466]">
              <div className="text-4xl mb-3 opacity-40">◈</div>
              <p className="text-sm">Buffer clear. Capture anything that's taking up space in your head.</p>
            </div>
          )}

          {visibleItems.map((item, idx) => {
            const pri     = getPriority(item.priority || 'normal')
            const isSelected = selectedIdx === idx
            const isDimmed   = item.promoted || item.archived
            const result  = sortResult[item.id]
            const linkedProject = item.bucketId ? projects.find(p => p.id === item.bucketId) : null

            return (
              <div
                key={item.id}
                onClick={() => setSelectedIdx(isSelected ? null : idx)}
                className={`border-l-4 border border-[#1e1e3a] bg-[#0d0d0d] cursor-pointer
                  transition-all select-none
                  ${pri.border}
                  ${isSelected ? 'border-[#00fff730] shadow-[0_0_8px_#00fff720]' : 'hover:border-[#1e1e3a]'}
                  ${isDimmed ? 'opacity-30' : ''}
                `}
              >
                <div className="flex items-start gap-3 px-4 py-3">
                  {/* Priority label */}
                  <span className={`text-xs shrink-0 mt-0.5 ${pri.text}`}>[{pri.label}]</span>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${item.promoted ? 'line-through text-[#444466]' : 'text-[#e0e0e0]'}`}>
                      {item.text}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-[#444466]">{formatTs(item.createdAt)}</span>
                      {linkedProject && (
                        <span className="text-xs text-[#00fff780]">→ {linkedProject.name}</span>
                      )}
                      {item.promoted && <span className="text-xs text-[#444466]">PROMOTED</span>}
                      {item.archived && <span className="text-xs text-[#444466]">ARCHIVED</span>}
                    </div>
                  </div>

                  {/* Action buttons — visible on select */}
                  {isSelected && !isDimmed && (
                    <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setPromotingId(item.id)}
                        className="text-xs text-[#00fff7] border border-[#00fff730] px-2 py-1 hover:bg-[#00fff710]
                                   flex items-center gap-1"
                        title="Promote to bucket (P)"
                      >
                        <ArrowRight size={11} /> P
                      </button>
                      <button
                        onClick={() => { archiveBrainDumpItem(item.id); setSelectedIdx(null) }}
                        className="text-xs text-[#444466] border border-[#1e1e3a] px-2 py-1 hover:text-[#e0e0e0]
                                   flex items-center gap-1"
                        title="Archive (X)"
                      >
                        <Archive size={11} /> X
                      </button>
                      <button
                        onClick={() => handleSort(item)}
                        disabled={sortingId === item.id}
                        className="text-xs text-[#ff00ff] border border-[#ff00ff30] px-2 py-1 hover:bg-[#ff00ff10]
                                   flex items-center gap-1 disabled:opacity-40"
                        title="AI sort"
                      >
                        <Zap size={11} /> {sortingId === item.id ? '…' : 'AI'}
                      </button>
                    </div>
                  )}
                </div>

                {/* AI sort result */}
                {result && (
                  <div className="border-t border-[#1e1e3a] bg-[#1a1a2e] px-4 py-2" onClick={e => e.stopPropagation()}>
                    {result.error ? (
                      <p className="text-xs text-[#ff2020]">{result.error}</p>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs text-[#444466]">
                          <span className="text-[#e0e0e0]">{result.title || item.text}</span>
                          {' '}→{' '}<span className="text-[#00fff7]">{result.project}</span>
                          {' / '}<span className="text-[#00fff780]">{result.bucket}</span>
                          {' · '}<span className="text-[#ff00ff80]">{result.type}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleConfirmSort(item)}
                            className="text-xs text-[#0d0d0d] bg-[#00fff7] hover:bg-[#00fff7cc] px-2 py-0.5 flex items-center gap-1 font-bold"
                          >
                            <Check size={10} /> MOVE
                          </button>
                          <button
                            onClick={() => setSortResult(r => { const c = {...r}; delete c[item.id]; return c })}
                            className="text-xs text-[#444466] hover:text-[#e0e0e0] px-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bucket picker for promote */}
                {promotingId === item.id && (
                  <div className="border-t border-[#1e1e3a] bg-[#1a1a2e] px-4 py-3" onClick={e => e.stopPropagation()}>
                    <p className="text-xs text-[#00fff7] mb-2 uppercase tracking-wider">Promote to project:</p>
                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                      {projects.map(proj => (
                        <div key={proj.id} className="flex flex-col gap-0.5">
                          <p className="text-xs text-[#444466] uppercase tracking-wide px-1">{proj.name}</p>
                          {proj.buckets.map(bkt => (
                            <button
                              key={bkt.id}
                              onClick={() => {
                                promoteBrainDumpItem(item.id, proj.id, bkt.id)
                                setPromotingId(null)
                                setSelectedIdx(null)
                              }}
                              className="text-xs text-left text-[#e0e0e0] px-3 py-1.5 hover:bg-[#00fff710]
                                         hover:text-[#00fff7] border border-transparent hover:border-[#00fff730]"
                            >
                              {bkt.name}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setPromotingId(null)}
                      className="text-xs text-[#444466] hover:text-[#e0e0e0] mt-2"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {/* Archived toggle */}
          {archivedItems.length > 0 && (
            <button
              onClick={() => setShowArchived(v => !v)}
              className="text-xs text-[#444466] hover:text-[#e0e0e0] flex items-center gap-1.5 py-2 mt-2"
            >
              <ChevronDown size={12} className={showArchived ? 'rotate-180' : ''} />
              {showArchived ? 'Hide' : 'Show'} {archivedItems.length} archived
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
