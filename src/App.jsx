import { useEffect } from 'react'
import useStore from './store/useStore'
import { Sidebar } from './components/layout/Sidebar'
import { NudgeBanner } from './components/layout/NudgeBanner'
import { ItemDetailPanel } from './components/layout/ItemDetailPanel'
import { BoardView } from './components/board/BoardView'
import { TodayView } from './components/today/TodayView'
import { TimelineView } from './components/timeline/TimelineView'
import { MeetingNotesView } from './components/meetings/MeetingNotesView'
import { BrainDumpView } from './components/braindump/BrainDumpView'
import { SettingsView } from './components/settings/SettingsView'
import { Toast } from './components/ui/Toast'

function App() {
  const { activeView, selectedItemId, init } = useStore()

  useEffect(() => {
    init()
  }, [])

  const showDetailPanel = selectedItemId && ['board', 'today', 'timeline'].includes(activeView)

  return (
    <div className="h-screen flex overflow-hidden bg-parchment">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Nudge banner */}
        <NudgeBanner />

        {/* View + detail panel row */}
        <div className="flex-1 flex overflow-hidden">
          {/* Active view */}
          <div className="flex-1 overflow-hidden">
            {activeView === 'board' && <BoardView />}
            {activeView === 'today' && <TodayView />}
            {activeView === 'timeline' && <TimelineView />}
            {activeView === 'meetings' && <MeetingNotesView />}
            {activeView === 'braindump' && <BrainDumpView />}
            {activeView === 'settings' && <SettingsView />}
          </div>

          {/* Item detail panel */}
          {showDetailPanel && <ItemDetailPanel />}
        </div>
      </div>

      {/* Toast */}
      <Toast />
    </div>
  )
}

export default App
