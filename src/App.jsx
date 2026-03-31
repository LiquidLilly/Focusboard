import { useEffect } from 'react'
import useStore from './store/useStore'
import Header from './components/layout/Header'
import SettingsPanel from './components/layout/SettingsPanel'
import BrainDumpPanel from './components/braindump/BrainDumpPanel'
import TaskBoard from './components/board/TaskBoard'
import TaskDetailPanel from './components/board/TaskDetailPanel'
import MeetingNotesPanel from './components/meetings/MeetingNotesPanel'
import TomorrowPlanner from './components/planner/TomorrowPlanner'
import MindspaceView from './components/mindspace/MindspaceView'

// Toast component — minimal, inline
function Toast() {
  const { toast } = useStore()
  if (!toast) return null
  return (
    <div
      style={{
        position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500,
        background: 'var(--bg-overlay)', color: 'var(--text-primary)',
        border: '1px solid var(--border-default)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        zIndex: 100, pointerEvents: 'none',
      }}
    >
      {toast}
    </div>
  )
}

function App() {
  const { activeView, selectedTaskId, settingsOpen } = useStore()

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Header />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {activeView === 'board' && (
          <>
            <BrainDumpPanel />
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <TaskBoard />
            </div>
            <MeetingNotesPanel />
            {selectedTaskId && <TaskDetailPanel />}
          </>
        )}

        {activeView === 'planner' && (
          <TomorrowPlanner />
        )}

        {activeView === 'mindspace' && (
          <MindspaceView />
        )}
      </div>

      {settingsOpen && <SettingsPanel />}
      <Toast />
    </div>
  )
}

export default App
