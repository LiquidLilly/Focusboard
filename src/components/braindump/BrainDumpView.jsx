import { useState, useRef, useEffect } from 'react'
import useStore from '../../store/useStore'
import { Button } from '../ui/Button'
import { callClaude, getApiKey } from '../../hooks/useAI'
import { generateId } from '../../utils/uuid'
import { Trash2, ArrowRight, Check, Zap } from 'lucide-react'

export function BrainDumpView() {
  const { brainDump, addBrainDumpItem, deleteBrainDumpItem, updateBrainDumpItem, projects, addItem, setSelectedItemId } = useStore()
  const [inputValue, setInputValue] = useState('')
  const [sortingId, setSortingId] = useState(null)
  const [sortResult, setSortResult] = useState({})
  const inputRef = useRef(null)

  // Keyboard shortcut: N to focus
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'n' || e.key === 'N') {
        const target = e.target
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          inputRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  function handleCapture(e) {
    e.preventDefault()
    if (!inputValue.trim()) return
    addBrainDumpItem(inputValue.trim())
    setInputValue('')
  }

  async function handleSort(item) {
    if (!getApiKey()) {
      setSortResult(r => ({ ...r, [item.id]: { error: 'No API key. Add one in Settings.' } }))
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
2. Which bucket (e.g., "To Do", "Backlog")
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

    const projectName = result.project
    const bucketName = result.bucket
    const type = ['task', 'todo', 'goal'].includes(result.type) ? result.type : 'task'
    const title = result.title || item.text

    const project = projects.find(p => p.name.toLowerCase() === projectName?.toLowerCase()) || projects[0]
    if (!project) return

    const bucket = project.buckets.find(b => b.name.toLowerCase() === bucketName?.toLowerCase()) || project.buckets[0]
    if (!bucket) return

    const itemId = addItem(project.id, bucket.id, { title, type, description: item.text })
    deleteBrainDumpItem(item.id)
    setSortResult(r => { const copy = { ...r }; delete copy[item.id]; return copy })
    setSelectedItemId(itemId)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 font-mono">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-charcoal flex items-center gap-2">
            <Zap size={18} className="text-amber-500" />
            Brain Dump
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">Press N anywhere to capture. No friction, no categories — just dump it.</p>
        </div>

        {/* Capture input */}
        <form onSubmit={handleCapture} className="mb-6">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="What's on your mind? Press Enter to capture…"
              autoFocus
              className="flex-1 font-mono text-sm border-2 border-charcoal bg-parchment px-3 py-2.5 text-charcoal placeholder-stone-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="font-mono text-sm border-2 border-charcoal bg-charcoal text-parchment px-4 py-2.5 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Capture
            </button>
          </div>
        </form>

        {/* Items list */}
        {brainDump.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <div className="text-3xl mb-3">💭</div>
            <p className="text-sm">Your head is clear. Or you haven't started yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {brainDump.map(item => {
              const result = sortResult[item.id]
              return (
                <div key={item.id} className="border border-warm-gray bg-parchment shadow-[2px_2px_0px_#c8c4bb]">
                  <div className="flex items-start gap-2 p-3">
                    <p className="flex-1 text-sm text-charcoal">{item.text}</p>
                    <div className="flex gap-1.5 shrink-0">
                      {item.done ? (
                        <span className="text-xs text-green-600 flex items-center gap-1"><Check size={11} /> Done</span>
                      ) : (
                        <button
                          onClick={() => updateBrainDumpItem(item.id, { done: true })}
                          className="text-xs text-stone-400 hover:text-green-600 border border-stone-200 px-1.5 py-0.5 flex items-center gap-1"
                          title="Mark done"
                        >
                          <Check size={11} />
                        </button>
                      )}
                      <button
                        onClick={() => handleSort(item)}
                        disabled={sortingId === item.id}
                        className="text-xs text-stone-500 hover:text-charcoal border border-stone-200 px-1.5 py-0.5 flex items-center gap-1 disabled:opacity-50"
                        title="Sort with AI"
                      >
                        <ArrowRight size={11} />
                        {sortingId === item.id ? '…' : 'Sort it'}
                      </button>
                      <button
                        onClick={() => deleteBrainDumpItem(item.id)}
                        className="text-stone-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Sort result */}
                  {result && (
                    <div className="border-t border-warm-gray bg-stone-50 px-3 py-2">
                      {result.error ? (
                        <p className="text-xs text-red-600">{result.error}</p>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs text-stone-500">
                            <span className="text-charcoal font-medium">{result.title || item.text}</span>
                            {' '}&rarr; <span className="text-stone-400">{result.project}</span>
                            {' / '}<span className="text-stone-400">{result.bucket}</span>
                            {' · '}<span className="text-stone-400">{result.type}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleConfirmSort(item)}
                              className="text-xs font-mono text-parchment bg-charcoal hover:bg-stone-700 px-2 py-0.5 flex items-center gap-1"
                            >
                              <Check size={10} /> Move
                            </button>
                            <button
                              onClick={() => setSortResult(r => { const c = {...r}; delete c[item.id]; return c })}
                              className="text-xs text-stone-400 hover:text-charcoal"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
