import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Check, Copy, Sparkles, Trash2, MessageSquare, Send, X, CheckSquare, Square } from 'lucide-react'
import useStore from '../../store/useStore'
import BrainDumpItem from './BrainDumpItem'
import { callClaudeStream, getApiKey } from '../../hooks/useAI'
import { formatRelativeTime } from '../../utils/dates'
import { generateId } from '../../utils/uuid'

const BUCKET_NAMES = [
  'Site Startup Support', 'MES/Automation', 'Process School',
  'Supply Chain', 'Data Trending/APR', 'Process Cleaning', 'Contamination Control',
]

const SYSTEM_PROMPT = `You are an assistant embedded in a personal productivity tool. The user has ADHD and anxiety. They need proactive, specific, direct help identifying themes, work buckets, and clear task titles from captured thoughts.
Be calm, direct, and specific. Use short bullets. Surface what they might miss. Never be vague.
Their work buckets are: ${BUCKET_NAMES.join(', ')}.`

export default function BrainDumpPanel() {
  const { brainDump, addBrainDumpItem, deleteBrainDumpItem, leftPanelOpen, setLeftPanel, showToast } = useStore()
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  // Selection mode
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected]     = useState(new Set())

  // In-app Claude chat drawer
  const [chatOpen, setChatOpen]         = useState(false)
  const [chatHistory, setChatHistory]   = useState([])
  const [chatInput, setChatInput]       = useState('')
  const [chatStreaming, setChatStreaming] = useState(false)
  const [contextItems, setContextItems] = useState([])
  const chatEndRef = useRef(null)

  // Undo delete
  const [undoItems, setUndoItems] = useState(null)
  const undoTimer = useRef(null)

  useEffect(() => {
    if (leftPanelOpen) textareaRef.current?.focus()
  }, [leftPanelOpen])

  useEffect(() => {
    function onKey(e) {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'n' || e.key === 'N') {
        setLeftPanel(true)
        setTimeout(() => textareaRef.current?.focus(), 50)
      }
      if (e.key === 'Escape' && selectMode) exitSelectMode()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectMode])

  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, chatOpen])

  function capture() {
    const trimmed = text.trim()
    if (!trimmed) return
    addBrainDumpItem(trimmed)
    setText('')
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); capture() }
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelected(new Set())
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() { setSelected(new Set(sorted.map(i => i.id))) }
  function deselectAll() { setSelected(new Set()) }

  const sorted = [...brainDump].sort((a, b) => {
    if (a.important && !b.important) return -1
    if (!a.important && b.important) return 1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  function getSelectedItems() {
    const ids = selected.size > 0 ? selected : new Set(sorted.map(i => i.id))
    return sorted.filter(i => ids.has(i.id))
  }

  // ── Copy actions ──────────────────────────────────────────────────────────

  function copySelected() {
    const items = getSelectedItems()
    const text = items.map(i => `• ${i.text} (captured ${formatRelativeTime(i.createdAt)})`).join('\n')
    navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard'))
  }

  function copyForClaude() {
    const items = getSelectedItems()
    const numbered = items.map((i, idx) => `${idx + 1}. ${i.text}`).join('\n')
    const prompt = `Here are some captured thoughts I need help organizing:\n\n${numbered}\n\nPlease help me: identify themes, suggest which of my work buckets these belong in (${BUCKET_NAMES.join(', ')}), and draft clear task titles for each.`
    navigator.clipboard.writeText(prompt).then(() => showToast('Prompt copied — paste into Claude'))
  }

  function openChatWithSelected() {
    const items = getSelectedItems()
    setContextItems(items)
    setChatHistory([])
    setChatInput('')
    setChatOpen(true)
  }

  function clearSelected() {
    const items = getSelectedItems()
    setUndoItems(items)
    items.forEach(i => deleteBrainDumpItem(i.id))
    exitSelectMode()

    if (undoTimer.current) clearTimeout(undoTimer.current)
    showToast('Deleted · Undo?')
    undoTimer.current = setTimeout(() => setUndoItems(null), 5000)
  }

  function undoClear() {
    if (!undoItems) return
    const { addBrainDumpItem: add } = useStore.getState()
    // Re-add in original order (reversed since addBrainDumpItem prepends)
    ;[...undoItems].reverse().forEach(i => {
      useStore.getState().brainDump.find(x => x.id === i.id) || add(i.text)
    })
    setUndoItems(null)
    showToast('Restored')
  }

  // ── In-app Claude chat ────────────────────────────────────────────────────

  async function sendChat() {
    const msg = chatInput.trim()
    if (!msg) return
    if (!getApiKey()) { showToast('Add an API key in Settings'); return }

    const userMsg = { role: 'user', content: msg, id: generateId() }
    const newHistory = [...chatHistory, userMsg]
    setChatHistory(newHistory)
    setChatInput('')
    setChatStreaming(true)

    const assistantMsg = { role: 'assistant', content: '', id: generateId() }
    setChatHistory(h => [...h, assistantMsg])

    const contextText = contextItems.map((i, idx) => `${idx + 1}. ${i.text} (captured ${formatRelativeTime(i.createdAt)})`).join('\n')
    const systemWithContext = `${SYSTEM_PROMPT}

The user has shared these captured thoughts for you to help with:
${contextText}`

    try {
      await callClaudeStream(
        msg,
        (_, full) => {
          setChatHistory(h => h.map(m => m.id === assistantMsg.id ? { ...m, content: full } : m))
        },
        systemWithContext,
        1024,
      )
    } catch (e) {
      setChatHistory(h => h.map(m => m.id === assistantMsg.id ? { ...m, content: `Error: ${e.message}` } : m))
    } finally {
      setChatStreaming(false)
    }
  }

  function onChatKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (!leftPanelOpen) {
    return (
      <div
        className="flex items-center justify-center cursor-pointer"
        style={{ width: 28, background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)' }}
        onClick={() => setLeftPanel(true)}
        title="Open Brain Dump"
      >
        <div style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Brain Dump
        </div>
        <ChevronRight size={14} style={{ color: 'var(--text-muted)', marginTop: 8 }} />
      </div>
    )
  }

  const selCount = selected.size
  const canCopyForClaude = selCount >= 3 && selCount <= 5

  return (
    <div
      className="flex flex-col h-full"
      style={{ width: 280, minWidth: 280, background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)', position: 'relative' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
          Brain Dump
          {brainDump.length > 0 && (
            <span style={{ marginLeft: 6, background: 'var(--bg-elevated)', color: 'var(--text-muted)', borderRadius: 999, padding: '1px 7px', fontSize: 10 }}>
              {brainDump.length}
            </span>
          )}
        </span>
        <div className="flex items-center gap-1">
          {!selectMode && brainDump.length > 0 && (
            <button
              onClick={() => setSelectMode(true)}
              title="Select items"
              style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              Select
            </button>
          )}
          <button onClick={() => setLeftPanel(false)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', padding: 2, cursor: 'pointer' }}>
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* Selection toolbar */}
      {selectMode && (
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {selCount > 0 ? `${selCount} selected` : 'Select items'}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={selectAll} style={selBtn}>All</button>
              <button onClick={deselectAll} style={selBtn}>None</button>
              <button onClick={exitSelectMode} style={{ ...selBtn, padding: '2px 4px' }}><X size={11} /></button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            <ToolbarBtn icon={<Copy size={11} />} label="Copy" onClick={copySelected} title="Copy to clipboard" />
            <ToolbarBtn
              icon={<Sparkles size={11} />}
              label="Copy for Claude"
              onClick={copyForClaude}
              disabled={!canCopyForClaude}
              title={canCopyForClaude ? 'Copy formatted prompt' : 'Select 3–5 items first'}
            />
            <ToolbarBtn
              icon={<MessageSquare size={11} />}
              label="Chat"
              onClick={openChatWithSelected}
              title="Open in-app Claude chat"
            />
            <ToolbarBtn
              icon={<Trash2 size={11} />}
              label="Delete"
              onClick={clearSelected}
              disabled={selCount === 0}
              color="var(--accent-red, #e05c5c)"
              title="Delete selected"
            />
          </div>
        </div>
      )}

      {/* Capture textarea */}
      {!selectMode && (
        <div className="px-3 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="What's on your mind? Hit Enter to capture."
            rows={3}
            style={{
              width: '100%', padding: '8px 10px', fontSize: 13, resize: 'none',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 8, color: 'var(--text-primary)', outline: 'none',
            }}
            className="focus:border-accent-primary"
          />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Enter to capture · Shift+Enter for newline · N anywhere to focus
          </p>
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {sorted.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 24 }}>
            Nothing captured yet
          </p>
        ) : (
          sorted.map(item => (
            selectMode ? (
              <SelectableItem
                key={item.id}
                item={item}
                checked={selected.has(item.id)}
                onToggle={() => toggleSelect(item.id)}
              />
            ) : (
              <BrainDumpItem key={item.id} item={item} />
            )
          ))
        )}
      </div>

      {/* In-app Claude chat drawer */}
      {chatOpen && (
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '55%', background: 'var(--bg-surface)',
            borderTop: '2px solid var(--border-accent)',
            display: 'flex', flexDirection: 'column',
            zIndex: 30,
          }}
        >
          {/* Chat header */}
          <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Chat with Claude · {contextItems.length} item{contextItems.length !== 1 ? 's' : ''} as context
            </span>
            <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2">
            {chatHistory.length === 0 && (
              <div style={{ padding: '12px 4px' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Context items:</p>
                {contextItems.map((i, idx) => (
                  <p key={i.id} style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, paddingLeft: 8, borderLeft: '2px solid var(--border-subtle)', marginBottom: 4 }}>
                    {idx + 1}. {i.text}
                  </p>
                ))}
                <div className="flex flex-col gap-1 mt-3">
                  {['Identify themes', 'Suggest task titles', 'Which buckets fit?', 'Prioritize these for me'].map(s => (
                    <button key={s} onClick={() => setChatInput(s)} style={{ padding: '4px 8px', fontSize: 11, borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left' }}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {chatHistory.map(msg => (
              <ChatBubble
                key={msg.id}
                msg={msg}
                isStreaming={chatStreaming && msg === chatHistory[chatHistory.length - 1] && msg.role === 'assistant'}
              />
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="px-3 py-2" style={{ borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <div className="flex gap-2 items-end">
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={onChatKeyDown}
                placeholder="Ask Claude… (Enter to send)"
                rows={2}
                style={{
                  flex: 1, padding: '6px 8px', fontSize: 12, resize: 'none',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                  borderRadius: 8, color: 'var(--text-primary)', outline: 'none', lineHeight: 1.5,
                }}
              />
              <button
                onClick={sendChat}
                disabled={chatStreaming || !chatInput.trim()}
                style={{
                  padding: '7px 9px', borderRadius: 8,
                  background: chatStreaming || !chatInput.trim() ? 'var(--bg-elevated)' : 'rgba(157,127,232,0.15)',
                  border: '1px solid rgba(157,127,232,0.3)',
                  color: chatStreaming || !chatInput.trim() ? 'var(--text-muted)' : '#9d7fe8',
                  cursor: chatStreaming || !chatInput.trim() ? 'default' : 'pointer',
                }}
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SelectableItem({ item, checked, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-start gap-2 text-left w-full rounded-xl p-3"
      style={{
        background: checked ? 'rgba(72,185,199,0.08)' : 'var(--bg-elevated)',
        border: `1px solid ${checked ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
        cursor: 'pointer',
      }}
    >
      <span style={{ marginTop: 2, flexShrink: 0, color: checked ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
        {checked ? <CheckSquare size={14} /> : <Square size={14} />}
      </span>
      <div className="flex flex-col gap-1 flex-1">
        {item.important && (
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent-orange)', textTransform: 'uppercase' }}>⚡ Important</span>
        )}
        <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{item.text}</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatRelativeTime(item.createdAt)}</p>
      </div>
    </button>
  )
}

function ChatBubble({ msg, isStreaming }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          maxWidth: '88%', padding: '7px 10px',
          borderRadius: isUser ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
          fontSize: 12, lineHeight: 1.55, whiteSpace: 'pre-wrap',
          background: isUser ? 'rgba(157,127,232,0.15)' : 'var(--bg-elevated)',
          border: `1px solid ${isUser ? 'rgba(157,127,232,0.25)' : 'var(--border-subtle)'}`,
          color: 'var(--text-primary)',
        }}
      >
        {msg.content || (isStreaming ? '' : '…')}
        {isStreaming && <span className="streaming-cursor" />}
      </div>
    </div>
  )
}

function ToolbarBtn({ icon, label, onClick, disabled, color, title }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      title={title}
      style={{
        padding: '4px 8px', fontSize: 11, borderRadius: 6,
        background: 'var(--bg-base)', border: '1px solid var(--border-subtle)',
        color: disabled ? 'var(--text-muted)' : (color || 'var(--text-secondary)'),
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        display: 'flex', alignItems: 'center', gap: 4,
      }}
    >
      {icon}{label}
    </button>
  )
}

const selBtn = {
  fontSize: 10, padding: '2px 7px', borderRadius: 5,
  background: 'var(--bg-base)', border: '1px solid var(--border-subtle)',
  color: 'var(--text-muted)', cursor: 'pointer',
}
