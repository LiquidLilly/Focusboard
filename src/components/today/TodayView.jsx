import { useState } from 'react'
import useStore from '../../store/useStore'
import MorningStartup from './MorningStartup'
import IntentionCards from './IntentionCards'
import CalendarStrip from './CalendarStrip'
import CaptureInbox from './CaptureInbox'
import PreMeetingCard from './PreMeetingCard'
import PostMeetingCard from './PostMeetingCard'
import useMsGraph from '../../hooks/useMsGraph'

export default function TodayView() {
  const { morningDone, setActiveView } = useStore()
  const { events, connected } = useMsGraph()

  const [selectedEvent, setSelectedEvent] = useState(null)
  const [cardMode, setCardMode] = useState(null) // 'pre' | 'post'

  const now = new Date()

  function onEventClick(event) {
    const end = new Date(event.end?.dateTime || event.end?.date || '')
    const isPast = end < now
    setSelectedEvent(event)
    setCardMode(isPast ? 'post' : 'pre')
  }

  function closeCard() {
    setSelectedEvent(null)
    setCardMode(null)
  }

  if (!morningDone) {
    return (
      <div style={{ height: 'calc(100vh - 48px)', overflowY: 'auto', background: 'var(--bg-base)' }}>
        <MorningStartup />
      </div>
    )
  }

  return (
    <div style={{ height: 'calc(100vh - 48px)', overflowY: 'auto', background: 'var(--bg-base)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Today's 3 intentions */}
        <section>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12 }}>
            Today's 3
          </div>
          <IntentionCards />
        </section>

        {/* Calendar strip */}
        <section>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12 }}>
            Today's Meetings
          </div>
          <CalendarStrip events={events} connected={connected} onEventClick={onEventClick} />
        </section>

        {/* Meeting detail card */}
        {selectedEvent && cardMode === 'pre' && (
          <section>
            <PreMeetingCard event={selectedEvent} onClose={closeCard} />
          </section>
        )}

        {selectedEvent && cardMode === 'post' && (
          <section>
            <PostMeetingCard
              event={selectedEvent}
              onClose={closeCard}
              onGoToReflect={() => { closeCard(); setActiveView('reflect') }}
            />
          </section>
        )}

        {/* Capture inbox */}
        <section>
          <CaptureInbox />
        </section>

      </div>
    </div>
  )
}
