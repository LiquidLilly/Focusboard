import { useState, useEffect, useRef } from 'react'
import useStore from '../../store/useStore'

export default function QuickCaptureOverlay() {
  const { setCaptureOpen, addCaptureItem, showToast } = useStore()
  const [text, setText] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') setCaptureOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setCaptureOpen])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) { setCaptureOpen(false); return }
    addCaptureItem(trimmed)
    showToast('Captured')
    setCaptureOpen(false)
  }

  return (
    // Backdrop
    <div
      onClick={() => setCaptureOpen(false)}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,17,23,0.75)',
        zIndex: 900,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 12,
          padding: '20px 24px',
          width: 560,
          maxWidth: '90vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12 }}>
          Quick Capture
        </div>
        <form onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e)
            }}
            placeholder="What's in your head? Just type it."
            rows={3}
            style={{
              width: '100%', resize: 'none',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 14,
              color: 'var(--text-primary)',
              lineHeight: 1.6,
              outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--border-focus)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-default)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Enter to save · Shift+Enter for new line · Esc to close
            </span>
            <button
              type="submit"
              style={{
                background: 'var(--accent)', color: 'var(--text-inverse)',
                border: 'none', borderRadius: 8,
                padding: '7px 18px', fontSize: 13, fontWeight: 500,
              }}
            >
              Capture
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
