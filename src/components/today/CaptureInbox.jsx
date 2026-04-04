import { useState } from 'react'
import { Check, ArrowRight, ArrowLeft, Trash2 } from 'lucide-react'
import useStore from '../../store/useStore'
import { isOverdue, isDueSoon, formatDueDate } from '../../utils/dates'
import { formatDistanceToNow } from 'date-fns'

export default function CaptureInbox() {
  const { capture, archiveCaptureItem, sendCaptureToBoard, sendCaptureToToday, deleteCaptureItem, buckets, showToast } = useStore()
  const [bucketMenuFor, setBucketMenuFor] = useState(null)

  const today = new Date().toISOString().slice(0, 10)
  const todayItems = capture.filter(i => !i.done && i.createdAt?.slice(0, 10) === today)

  if (todayItems.length === 0) return null

  return (
    <div>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12 }}>
        Captured Today
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {todayItems.map(item => {
          const overdue = isOverdue(item.dueDate)
          const dueSoon = isDueSoon(item.dueDate)

          return (
            <div
              key={item.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '10px 14px', borderRadius: 10,
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                opacity: item.createdAt && (Date.now() - new Date(item.createdAt).getTime()) > 24 * 60 * 60 * 1000 ? 0.5 : 1,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0, marginBottom: 4, lineHeight: 1.5 }}>
                  {item.important && <span style={{ color: 'var(--accent-warm)', marginRight: 4 }}>⚡</span>}
                  {item.text}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </span>
                  {item.dueDate && (
                    <span style={{ fontSize: 12, color: overdue ? 'var(--accent-red)' : dueSoon ? 'var(--accent-warm)' : 'var(--text-muted)' }}>
                      {formatDueDate(item.dueDate)}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {/* Done */}
                <SmallBtn onClick={() => archiveCaptureItem(item.id)} title="Mark done" color="var(--accent-green)">
                  <Check size={12} />
                </SmallBtn>

                {/* → Board */}
                <div style={{ position: 'relative' }}>
                  <SmallBtn onClick={() => setBucketMenuFor(bucketMenuFor === item.id ? null : item.id)} title="Send to Board">
                    <ArrowRight size={12} />
                  </SmallBtn>
                  {bucketMenuFor === item.id && (
                    <div style={{
                      position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: 4,
                      background: 'var(--bg-overlay)', border: '1px solid var(--border-default)',
                      borderRadius: 8, padding: '4px 0', minWidth: 180,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}>
                      {buckets.map(b => (
                        <button
                          key={b.id}
                          onClick={() => { sendCaptureToBoard(item.id, b.id); setBucketMenuFor(null) }}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 14px', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-raised)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* → Tomorrow (defer) */}
                <SmallBtn
                  onClick={() => {
                    const ok = sendCaptureToToday(item.id)
                    if (!ok) showToast('3 is enough. Which 3 matter most?')
                  }}
                  title="Add to Today's intentions"
                  color="var(--accent)"
                >
                  <ArrowLeft size={12} />
                </SmallBtn>

                {/* Delete */}
                <SmallBtn onClick={() => deleteCaptureItem(item.id)} title="Delete" color="var(--accent-red)">
                  <Trash2 size={12} />
                </SmallBtn>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SmallBtn({ onClick, title, color, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
        borderRadius: 6, cursor: 'pointer',
        color: color || 'var(--text-muted)',
        transition: 'all 150ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-overlay)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-raised)' }}
    >
      {children}
    </button>
  )
}
