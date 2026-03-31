import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import useStore from '../../store/useStore'
import BrainDumpItem from './BrainDumpItem'

export default function BrainDumpPanel() {
  const { brainDump, addBrainDumpItem, leftPanelOpen, setLeftPanel } = useStore()
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  // Auto-focus on mount
  useEffect(() => {
    if (leftPanelOpen) textareaRef.current?.focus()
  }, [leftPanelOpen])

  // Global N shortcut
  useEffect(() => {
    function onKey(e) {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'n' || e.key === 'N') {
        setLeftPanel(true)
        setTimeout(() => textareaRef.current?.focus(), 50)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function capture() {
    const trimmed = text.trim()
    if (!trimmed) return
    addBrainDumpItem(trimmed)
    setText('')
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      capture()
    }
  }

  // Sort: important first, then by recency
  const sorted = [...brainDump].sort((a, b) => {
    if (a.important && !b.important) return -1
    if (!a.important && b.important) return 1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

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

  return (
    <div
      className="flex flex-col h-full"
      style={{ width: 280, minWidth: 280, background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)' }}
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
        <button onClick={() => setLeftPanel(false)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', padding: 2, cursor: 'pointer' }}>
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Capture textarea */}
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

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {sorted.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 24 }}>
            Nothing captured yet
          </p>
        ) : (
          sorted.map(item => <BrainDumpItem key={item.id} item={item} />)
        )}
      </div>
    </div>
  )
}
