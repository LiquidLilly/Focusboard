import { useState, useMemo } from 'react'
import { Copy, Send, Trash2, CheckSquare } from 'lucide-react'
import useStore from '../../store/useStore'
import CaptureInput from './CaptureInput'
import CaptureItem from './CaptureItem'

export default function CaptureView() {
  const { capture, deleteCaptureItem, showToast } = useStore()
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds]     = useState(new Set())

  // Only show non-archived items
  const activeItems = useMemo(() => capture.filter(i => !i.done), [capture])

  // Groups: Important → Today → Earlier
  const today = new Date().toISOString().slice(0, 10)

  const important = activeItems.filter(i => i.important)
  const todayItems = activeItems.filter(i => !i.important && i.createdAt?.slice(0, 10) === today)
  const earlier   = activeItems.filter(i => !i.important && i.createdAt?.slice(0, 10) !== today)

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function exitSelectionMode() {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  function copySelected(asPrompt) {
    const items = activeItems.filter(i => selectedIds.has(i.id))
    let text
    if (asPrompt) {
      text = `Here are some thoughts I've captured. Help me understand what to prioritize and what action to take on each:\n\n${items.map(i => `- ${i.text}`).join('\n')}`
    } else {
      text = items.map(i => i.text).join('\n')
    }
    navigator.clipboard.writeText(text)
    showToast(asPrompt ? 'Copied as Claude prompt' : 'Copied to clipboard')
    exitSelectionMode()
  }

  function deleteSelected() {
    selectedIds.forEach(id => deleteCaptureItem(id))
    showToast(`${selectedIds.size} items deleted`)
    exitSelectionMode()
  }

  function renderGroup(label, items) {
    if (!items.length) return null
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--border-subtle)' }}>
          {label}
        </div>
        {items.map(item => (
          <CaptureItem
            key={item.id}
            item={item}
            selected={selectedIds.has(item.id)}
            onSelect={() => toggleSelect(item.id)}
            selectionMode={selectionMode}
          />
        ))}
      </div>
    )
  }

  return (
    <div style={{ height: 'calc(100vh - 48px)', overflow: 'hidden', display: 'flex' }}>
      {/* Left — Input zone */}
      <div style={{
        width: 400, flexShrink: 0,
        padding: '24px 20px',
        borderRight: '1px solid var(--border-subtle)',
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12 }}>
          Capture
        </div>
        <CaptureInput />
      </div>

      {/* Right — Item list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {activeItems.length} item{activeItems.length !== 1 ? 's' : ''}
          </span>
          {!selectionMode ? (
            <button
              onClick={() => setSelectionMode(true)}
              style={{ fontSize: 12, background: 'none', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-muted)', padding: '4px 12px', cursor: 'pointer' }}
            >
              Select
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedIds.size} selected</span>
              <button onClick={() => copySelected(false)} disabled={!selectedIds.size} style={selectionBtnStyle}><Copy size={12} /> Copy</button>
              <button onClick={() => copySelected(true)} disabled={!selectedIds.size} style={selectionBtnStyle}><Send size={12} /> As prompt</button>
              <button onClick={deleteSelected} disabled={!selectedIds.size} style={{ ...selectionBtnStyle, color: 'var(--accent-red)' }}><Trash2 size={12} /></button>
              <button onClick={exitSelectionMode} style={{ ...selectionBtnStyle, color: 'var(--text-secondary)' }}>Done</button>
            </div>
          )}
        </div>

        {activeItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 14, marginBottom: 8 }}>Nothing captured yet.</p>
            <p style={{ fontSize: 12 }}>Type something in the input, or press Space anywhere to quick capture.</p>
          </div>
        ) : (
          <>
            {renderGroup('Important', important)}
            {renderGroup('Today', todayItems)}
            {renderGroup('Earlier', earlier)}
          </>
        )}
      </div>
    </div>
  )
}

const selectionBtnStyle = {
  display: 'flex', alignItems: 'center', gap: 4,
  fontSize: 12, background: 'none', border: '1px solid var(--border-default)',
  borderRadius: 6, color: 'var(--text-muted)', padding: '4px 10px', cursor: 'pointer',
}
