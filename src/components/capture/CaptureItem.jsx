import { useState } from 'react'
import { Check, ArrowRight, Calendar as CalIcon, Pencil, Trash2, Flag } from 'lucide-react'
import useStore from '../../store/useStore'
import { formatDistanceToNow } from 'date-fns'
import { isOverdue, isDueSoon } from '../../utils/dates'

export default function CaptureItem({ item, selected, onSelect, selectionMode }) {
  const {
    archiveCaptureItem, sendCaptureToBoard, sendCaptureToToday,
    deleteCaptureItem, updateCaptureItem, buckets, showToast,
  } = useStore()

  const [editing, setEditing]     = useState(false)
  const [draft, setDraft]         = useState(item.text)
  const [bucketMenuOpen, setBucketMenuOpen] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [hovered, setHovered]     = useState(false)

  const overdue = isOverdue(item.dueDate)
  const dueSoon = isDueSoon(item.dueDate)

  function handleDone() {
    setCompleting(true)
    setTimeout(() => archiveCaptureItem(item.id), 200)
  }

  function handleSaveEdit() {
    const trimmed = draft.trim()
    if (trimmed) updateCaptureItem(item.id, { text: trimmed })
    setEditing(false)
  }

  const linkedBucket = item.bucketId ? buckets.find(b => b.id === item.bucketId) : null

  return (
    <div
      className={completing ? 'completing' : ''}
      style={{
        background: item.important ? '#1a1910' : 'var(--bg-surface)',
        border: `1px solid ${selected ? 'var(--accent)' : item.important ? 'rgba(232,164,74,0.3)' : 'var(--border-subtle)'}`,
        borderLeft: item.important ? '3px solid var(--accent-warm)' : undefined,
        borderRadius: 12,
        padding: '12px 16px',
        marginBottom: 8,
        position: 'relative',
        transition: 'border-color 150ms',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setBucketMenuOpen(false) }}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div
          onClick={onSelect}
          style={{
            position: 'absolute', top: 12, right: 12,
            width: 18, height: 18, borderRadius: 4,
            border: `2px solid ${selected ? 'var(--accent)' : 'var(--border-default)'}`,
            background: selected ? 'var(--accent)' : 'transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {selected && <Check size={11} color="var(--text-inverse)" />}
        </div>
      )}

      {/* Content */}
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSaveEdit()
              if (e.key === 'Escape') { setDraft(item.text); setEditing(false) }
            }}
            rows={3}
            style={{ width: '100%', fontSize: 14, lineHeight: 1.6, background: 'var(--bg-raised)', border: '1px solid var(--border-focus)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSaveEdit} style={{ padding: '5px 14px', fontSize: 12, background: 'var(--accent)', color: 'var(--text-inverse)', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>Save</button>
            <button onClick={() => { setDraft(item.text); setEditing(false) }} style={{ padding: '5px 14px', fontSize: 12, background: 'none', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)', margin: 0, marginBottom: 6, paddingRight: selectionMode ? 28 : 0 }}>
            {item.important && <span style={{ color: 'var(--accent-warm)', marginRight: 5 }}>⚡</span>}
            {item.text}
          </p>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </span>
            {item.dueDate && (
              <span style={{ fontSize: 12, color: overdue ? 'var(--accent-red)' : dueSoon ? 'var(--accent-warm)' : 'var(--text-muted)' }}>
                <CalIcon size={10} style={{ display: 'inline', marginRight: 3 }} />
                {item.dueDate}
              </span>
            )}
            {linkedBucket && (
              <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 999, background: 'var(--accent-muted)', color: 'var(--text-secondary)' }}>
                {linkedBucket.name}
              </span>
            )}
          </div>
        </>
      )}

      {/* Hover actions */}
      {!editing && !selectionMode && hovered && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
          {/* Done */}
          <ActionBtn onClick={handleDone} color="var(--accent-green)" label="Done" icon={<Check size={12} />} />

          {/* → Board */}
          <div style={{ position: 'relative' }}>
            <ActionBtn onClick={() => setBucketMenuOpen(v => !v)} label="→ Board" icon={<ArrowRight size={12} />} />
            {bucketMenuOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, zIndex: 50,
                background: 'var(--bg-overlay)', border: '1px solid var(--border-default)',
                borderRadius: 8, padding: '4px 0', minWidth: 180,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)', marginTop: 4,
              }}>
                {buckets.map(b => (
                  <button
                    key={b.id}
                    onClick={() => { sendCaptureToBoard(item.id, b.id); setBucketMenuOpen(false) }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 14px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-raised)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* → Today */}
          <ActionBtn onClick={() => { const ok = sendCaptureToToday(item.id); if (!ok) showToast('3 is enough. Which 3 matter most?') }} label="→ Today" icon={<CalIcon size={12} />} />

          <div style={{ flex: 1 }} />

          {/* Flag */}
          <ActionBtn
            onClick={() => updateCaptureItem(item.id, { important: !item.important })}
            color={item.important ? 'var(--accent-warm)' : undefined}
            icon={<Flag size={12} fill={item.important ? 'var(--accent-warm)' : 'none'} />}
          />

          {/* Edit */}
          <ActionBtn onClick={() => setEditing(true)} icon={<Pencil size={12} />} />

          {/* Delete */}
          <ActionBtn onClick={() => deleteCaptureItem(item.id)} color="var(--accent-red)" icon={<Trash2 size={12} />} />
        </div>
      )}
    </div>
  )
}

function ActionBtn({ onClick, color, label, icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', fontSize: 12, borderRadius: 6,
        background: 'transparent', border: '1px solid var(--border-default)',
        color: color || 'var(--text-secondary)',
        cursor: 'pointer', transition: 'all 150ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-raised)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      {icon}
      {label}
    </button>
  )
}
