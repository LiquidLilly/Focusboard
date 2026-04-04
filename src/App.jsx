import { useEffect } from 'react'
import useStore from './store/useStore'
import Header from './components/layout/Header'
import QuickCaptureOverlay from './components/layout/QuickCaptureOverlay'
import SettingsPanel from './components/layout/SettingsPanel'
import TodayView from './components/today/TodayView'
import CaptureView from './components/capture/CaptureView'
import BoardView from './components/board/BoardView'
import ReflectView from './components/reflect/ReflectView'
import TaskDetailPanel from './components/board/TaskDetailPanel'

function Toast() {
  const { toast } = useStore()
  if (!toast) return null
  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500,
      background: 'var(--bg-overlay)', color: 'var(--text-primary)',
      border: '1px solid var(--border-default)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      zIndex: 1000, pointerEvents: 'none',
    }}>
      {toast}
    </div>
  )
}

function App() {
  const { activeView, selectedTaskId, settingsOpen, captureOpen, setCaptureOpen } = useStore()

  // Space key → Quick Capture (skip if focus is inside an input)
  useEffect(() => {
    function onKeyDown(e) {
      if (captureOpen) return
      if (e.key !== ' ') return
      const tag = document.activeElement?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return
      if (document.activeElement?.isContentEditable) return
      e.preventDefault()
      setCaptureOpen(true)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [captureOpen, setCaptureOpen])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Header />

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeView === 'today'   && <TodayView />}
        {activeView === 'capture' && <CaptureView />}
        {activeView === 'board'   && <BoardView />}
        {activeView === 'reflect' && <ReflectView />}
      </div>

      {/* Task detail panel floats over board */}
      {activeView === 'board' && selectedTaskId && <TaskDetailPanel />}

      {captureOpen  && <QuickCaptureOverlay />}
      {settingsOpen && <SettingsPanel />}
      <Toast />
    </div>
  )
}

export default App
