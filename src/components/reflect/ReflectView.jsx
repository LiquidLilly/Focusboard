import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import useStore from '../../store/useStore'
import HardMomentTool from './HardMomentTool'
import ClarityCheckTool from './ClarityCheckTool'
import OneOnOnePrep from './OneOnOnePrep'
import { Trash2 } from 'lucide-react'

const TOOLS = [
  { id: 'hard-moment',    label: 'After a Hard Moment' },
  { id: 'clarity-check',  label: 'Clarity Check'       },
  { id: 'oneonone-prep',  label: '1-on-1 Prep'         },
]

export default function ReflectView() {
  const { reflect, deleteReflectEntry } = useStore()
  const [activeTool, setActiveTool] = useState('hard-moment')
  const [refresh, setRefresh] = useState(0)

  const typeLabels = {
    'hard-moment':   'Hard Moment',
    'clarity-check': 'Clarity Check',
    'oneonone-prep': '1-on-1 Prep',
  }

  return (
    <div
      style={{
        height: 'calc(100vh - 48px)',
        overflow: 'hidden',
        display: 'flex',
        background: '#13101a',   // warmer, more purple-tinted than base
      }}
    >
      {/* Left sidebar — past entries */}
      <div style={{
        width: 240, flexShrink: 0,
        borderRight: '1px solid rgba(157,127,232,0.15)',
        overflowY: 'auto',
        padding: '20px 0',
      }}>
        {/* Tool tabs */}
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              style={{
                textAlign: 'left', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                background: activeTool === tool.id ? 'rgba(157,127,232,0.15)' : 'transparent',
                color: activeTool === tool.id ? 'var(--reflect-accent)' : 'var(--text-secondary)',
                border: `1px solid ${activeTool === tool.id ? 'rgba(157,127,232,0.3)' : 'transparent'}`,
                cursor: 'pointer', transition: 'all 150ms',
              }}
            >
              {tool.label}
            </button>
          ))}
        </div>

        {/* Past entries */}
        {reflect.length > 0 && (
          <div style={{ padding: '0 8px' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '8px 8px 8px', marginBottom: 4 }}>
              Past entries
            </div>
            {reflect.map(entry => (
              <div
                key={entry.id}
                style={{
                  padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                  display: 'flex', alignItems: 'flex-start', gap: 6,
                }}
                className="group"
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                    {typeLabels[entry.type] || entry.type}
                  </div>
                  <div style={{
                    fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {entry.title || entry.userText}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                    {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <button
                  onClick={() => deleteReflectEntry(entry.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, opacity: 0, transition: 'opacity 150ms', flexShrink: 0 }}
                  className="group-hover:opacity-100"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right — active tool */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '40px 40px',
        maxWidth: 700,
      }}>
        {activeTool === 'hard-moment'   && <HardMomentTool   onEntryCreated={() => setRefresh(r => r + 1)} />}
        {activeTool === 'clarity-check' && <ClarityCheckTool />}
        {activeTool === 'oneonone-prep' && <OneOnOnePrep />}
      </div>
    </div>
  )
}
