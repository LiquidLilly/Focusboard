import { useState, useRef, useEffect } from 'react'
import { Flag, Calendar, Tag } from 'lucide-react'
import useStore from '../../store/useStore'

export default function CaptureInput() {
  const { addCaptureItem, buckets } = useStore()
  const [text, setText]         = useState('')
  const [important, setImportant] = useState(false)
  const [dueDate, setDueDate]   = useState('')
  const [bucketId, setBucketId] = useState('')
  const [toolbarVisible, setToolbarVisible] = useState(false)
  const textareaRef = useRef(null)

  // Auto-focus on mount
  useEffect(() => { textareaRef.current?.focus() }, [])

  function capture() {
    const trimmed = text.trim()
    if (!trimmed) return
    addCaptureItem(trimmed, {
      important,
      dueDate: dueDate || null,
      bucketId: bucketId || null,
    })
    setText('')
    setImportant(false)
    setDueDate('')
    setBucketId('')
    textareaRef.current?.focus()
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      capture()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => setToolbarVisible(true)}
        onBlur={() => setTimeout(() => setToolbarVisible(false), 150)}
        placeholder="What's in your head? Just type it."
        rows={4}
        style={{
          width: '100%', resize: 'none',
          background: 'var(--bg-raised)',
          border: '1px solid var(--border-default)',
          borderBottom: toolbarVisible ? '1px solid var(--border-default)' : '1px solid var(--border-default)',
          borderRadius: toolbarVisible ? '12px 12px 0 0' : 12,
          padding: '14px 16px',
          fontSize: 15, lineHeight: 1.6,
          color: 'var(--text-primary)',
          outline: 'none',
          transition: 'border-color 150ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-focus)' }}
        onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = 'var(--border-default)' }}
      />

      {/* Optional toolbar */}
      {toolbarVisible && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px',
          background: 'var(--bg-raised)',
          border: '1px solid var(--border-default)',
          borderTop: '1px solid var(--border-subtle)',
          borderRadius: '0 0 12px 12px',
          flexWrap: 'wrap',
        }}>
          {/* Flag */}
          <button
            onMouseDown={e => { e.preventDefault(); setImportant(v => !v) }}
            title="Flag as important"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 6, fontSize: 12,
              background: important ? 'rgba(232,164,74,0.15)' : 'transparent',
              color: important ? 'var(--accent-warm)' : 'var(--text-muted)',
              border: `1px solid ${important ? 'var(--accent-warm)' : 'var(--border-default)'}`,
              cursor: 'pointer',
            }}
          >
            <Flag size={12} fill={important ? 'var(--accent-warm)' : 'none'} />
            {important ? 'Flagged' : 'Flag'}
          </button>

          {/* Due date */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Calendar size={12} style={{ position: 'absolute', left: 8, color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{
                paddingLeft: 26, paddingRight: 8, paddingTop: 4, paddingBottom: 4,
                fontSize: 12, background: 'transparent',
                border: dueDate ? '1px solid var(--border-focus)' : '1px solid var(--border-default)',
                borderRadius: 6,
                color: dueDate ? 'var(--text-primary)' : 'var(--text-muted)',
                outline: 'none', cursor: 'pointer',
              }}
            />
          </div>

          {/* Bucket link */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Tag size={12} style={{ position: 'absolute', left: 8, color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <select
              value={bucketId}
              onChange={e => setBucketId(e.target.value)}
              style={{
                paddingLeft: 26, paddingRight: 8, paddingTop: 4, paddingBottom: 4,
                fontSize: 12, background: 'var(--bg-raised)',
                border: bucketId ? '1px solid var(--border-focus)' : '1px solid var(--border-default)',
                borderRadius: 6,
                color: bucketId ? 'var(--text-primary)' : 'var(--text-muted)',
                outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="">No bucket</option>
              {buckets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div style={{ flex: 1 }} />

          <button
            onMouseDown={e => { e.preventDefault(); capture() }}
            disabled={!text.trim()}
            style={{
              padding: '5px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              background: text.trim() ? 'var(--accent)' : 'var(--bg-overlay)',
              color: text.trim() ? 'var(--text-inverse)' : 'var(--text-muted)',
              border: 'none', cursor: text.trim() ? 'pointer' : 'default',
              transition: 'all 150ms',
            }}
          >
            Capture
          </button>
        </div>
      )}

      {!toolbarVisible && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
          Enter to capture · Shift+Enter for new line
        </p>
      )}
    </div>
  )
}
