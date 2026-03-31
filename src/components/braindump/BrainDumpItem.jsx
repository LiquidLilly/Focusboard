import { useState } from 'react'
import { Star, Trash2, ArrowRight, Sparkles, ChevronDown } from 'lucide-react'
import useStore from '../../store/useStore'
import { formatRelativeTime } from '../../utils/dates'
import { callClaudeStream, getApiKey } from '../../hooks/useAI'

export default function BrainDumpItem({ item }) {
  const { buckets, updateBrainDumpItem, deleteBrainDumpItem, sendBrainDumpToBoard, showToast } = useStore()
  const [showBucketPicker, setShowBucketPicker] = useState(false)
  const [aiResponse, setAiResponse]             = useState(null)
  const [streaming, setStreaming]               = useState(false)
  const [suggestedBucket, setSuggestedBucket]   = useState(null)

  const isImportant = item.important

  async function askClaude() {
    if (!getApiKey()) { showToast('Add an API key in Settings to use AI features'); return }
    setStreaming(true); setAiResponse('')
    try {
      await callClaudeStream(
        `I captured this thought: "${item.text}"\n\nWhat type of work item is this? Which of my buckets does it belong in? Suggest a clear task title. What should I do first?\n\nAnswer in 3–4 short bullets.`,
        (_, full) => setAiResponse(full),
      )
    } catch (e) {
      setAiResponse(`Error: ${e.message}`)
    } finally {
      setStreaming(false)
    }
  }

  function sendToBoard(bucketId) {
    sendBrainDumpToBoard(item.id, bucketId)
    setShowBucketPicker(false)
  }

  return (
    <div
      className="group relative flex flex-col gap-2 p-3 rounded-xl"
      style={{
        background:    isImportant ? '#1f1e16' : 'var(--bg-elevated)',
        border:        '1px solid var(--border-subtle)',
        borderLeft:    isImportant ? '3px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
        borderRadius:  12,
      }}
    >
      {/* Important badge */}
      {isImportant && (
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent-orange)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          ⚡ Important
        </span>
      )}

      {/* Text */}
      <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, wordBreak: 'break-word' }}>{item.text}</p>

      {/* Timestamp */}
      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatRelativeTime(item.createdAt)}</p>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* Flag important */}
        <ActionBtn
          icon={<Star size={12} fill={isImportant ? 'var(--accent-orange)' : 'none'} />}
          label={isImportant ? 'Flagged' : 'Flag'}
          color={isImportant ? 'var(--accent-orange)' : undefined}
          onClick={() => updateBrainDumpItem(item.id, { important: !isImportant })}
        />

        {/* Send to Board */}
        <div className="relative">
          <ActionBtn
            icon={<ArrowRight size={12} />}
            label="Send to Board"
            onClick={() => setShowBucketPicker(v => !v)}
          />
          {showBucketPicker && (
            <div
              className="absolute z-20 flex flex-col"
              style={{
                top: '100%', left: 0, marginTop: 4, minWidth: 200,
                background: 'var(--bg-overlay)', border: '1px solid var(--border-default)',
                borderRadius: 8, padding: 4,
              }}
            >
              {buckets.map(b => (
                <button
                  key={b.id}
                  onClick={() => sendToBoard(b.id)}
                  style={{
                    padding: '6px 10px', fontSize: 12, textAlign: 'left',
                    color: 'var(--text-primary)', background: 'none', border: 'none',
                    borderRadius: 6, cursor: 'pointer',
                  }}
                  className="hover:bg-bg-elevated"
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ask Claude */}
        <ActionBtn
          icon={<Sparkles size={12} />}
          label="Ask Claude"
          onClick={askClaude}
          disabled={streaming}
        />

        {/* Delete */}
        <ActionBtn
          icon={<Trash2 size={12} />}
          label=""
          onClick={() => deleteBrainDumpItem(item.id)}
          className="opacity-0 group-hover:opacity-100"
        />
      </div>

      {/* AI response */}
      {(aiResponse !== null) && (
        <div
          style={{
            marginTop: 4, padding: '8px 10px', borderRadius: 8, fontSize: 12,
            background: 'var(--bg-base)', border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6,
          }}
        >
          {aiResponse || '…'}
          {streaming && <span className="streaming-cursor" />}
        </div>
      )}
    </div>
  )
}

function ActionBtn({ icon, label, onClick, color, disabled, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1 transition-colors ${className}`}
      style={{
        fontSize: 11, padding: '3px 8px', borderRadius: 6,
        background: 'var(--bg-base)', border: '1px solid var(--border-subtle)',
        color: color || 'var(--text-muted)', cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon}{label}
    </button>
  )
}
