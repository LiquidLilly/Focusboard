import { useState, useEffect } from 'react'
import useStore from '../../store/useStore'

// CalendarStrip — shows MS Graph events or a graceful disconnected state
export default function CalendarStrip({ events, connected, onEventClick }) {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  // Filter to today's events
  const todayEvents = (events || []).filter(e => {
    const start = new Date(e.start?.dateTime || e.start?.date || '')
    return start.toISOString().slice(0, 10) === todayStr
  }).sort((a, b) => {
    const ta = new Date(a.start?.dateTime || a.start?.date || 0)
    const tb = new Date(b.start?.dateTime || b.start?.date || 0)
    return ta - tb
  })

  if (!connected) {
    return (
      <div style={{
        padding: '14px 16px', borderRadius: 10,
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic',
        textAlign: 'center',
      }}>
        Calendar not connected — sign in with Microsoft in Settings to see your meetings.
      </div>
    )
  }

  if (todayEvents.length === 0) {
    return (
      <div style={{
        padding: '14px 16px', borderRadius: 10,
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic',
        textAlign: 'center',
      }}>
        No meetings today.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
      {todayEvents.map(event => {
        const start = new Date(event.start?.dateTime || event.start?.date || '')
        const end   = new Date(event.end?.dateTime   || event.end?.date   || '')
        const isPast    = end < now
        const isCurrent = start <= now && end >= now
        const durationMin = Math.round((end - start) / 60000)

        const h = start.getHours() % 12 || 12
        const m = String(start.getMinutes()).padStart(2, '0')
        const ampm = start.getHours() >= 12 ? 'pm' : 'am'
        const timeStr = `${h}:${m} ${ampm}`

        return (
          <button
            key={event.id}
            onClick={() => onEventClick && onEventClick(event)}
            style={{
              flex: '0 0 auto', padding: '10px 14px',
              borderRadius: 10, textAlign: 'left', cursor: 'pointer',
              background: isCurrent ? 'rgba(91,156,246,0.12)' : isPast ? 'transparent' : 'var(--bg-surface)',
              border: isCurrent ? '1px solid rgba(91,156,246,0.4)' : '1px solid var(--border-subtle)',
              opacity: isPast ? 0.5 : 1,
              transition: 'all 150ms',
              minWidth: 160, maxWidth: 220,
              boxShadow: isCurrent ? '0 0 12px rgba(91,156,246,0.15)' : 'none',
            }}
          >
            <p style={{ fontSize: 12, color: isCurrent ? 'var(--accent)' : 'var(--text-muted)', marginBottom: 4 }}>
              {timeStr} · {durationMin}m
            </p>
            <p style={{
              fontSize: 13, color: isPast ? 'var(--text-muted)' : 'var(--text-primary)',
              fontWeight: isCurrent ? 500 : 400,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: 180,
            }}>
              {event.subject || event.summary || 'Meeting'}
            </p>
          </button>
        )
      })}
    </div>
  )
}
