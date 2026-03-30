import { useEffect, useCallback } from 'react'
import useStore from './store/useStore'
import { Sidebar } from './components/layout/Sidebar'
import { NudgeBanner } from './components/layout/NudgeBanner'
import { ItemDetailPanel } from './components/layout/ItemDetailPanel'
import { BoardView } from './components/board/BoardView'
import { BucketOverview } from './components/board/BucketOverview'
import { TodayView } from './components/today/TodayView'
import { TimelineView } from './components/timeline/TimelineView'
import { MeetingNotesView } from './components/meetings/MeetingNotesView'
import { BrainDumpView } from './components/braindump/BrainDumpView'
import { SettingsView } from './components/settings/SettingsView'
import { Toast } from './components/ui/Toast'

function App() {
  const {
    activeView, selectedItemId, init,
    projects, activeProjectId,
    setActiveView, setActiveProjectId, setSelectedItemId,
  } = useStore()

  useEffect(() => {
    init()
  }, [])

  // ── Breadcrumb info ──────────────────────────────────────────────────────────
  const activeProject = projects.find(p => p.id === activeProjectId)
  const breadcrumb = (() => {
    const parts = ['NEXUS']
    if (activeView === 'board' && activeProject) {
      parts.push(activeProject.name)
    } else if (activeView === 'overview') {
      parts.push('Ops Center')
    } else if (activeView === 'braindump') {
      parts.push('Brain Dump')
    } else if (activeView === 'today') {
      parts.push('Today')
    } else if (activeView === 'timeline') {
      parts.push('Timeline')
    } else if (activeView === 'meetings') {
      parts.push('Meeting Notes')
    } else if (activeView === 'settings') {
      parts.push('Settings')
    }
    return parts.join(' › ')
  })()

  // ── Global keybinds ──────────────────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e) {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      // Tab or B — toggle braindump ↔ overview
      if (e.key === 'Tab' || e.key === 'b' || e.key === 'B') {
        e.preventDefault()
        if (activeView === 'braindump') {
          setActiveView('overview')
        } else if (activeView !== 'board') {
          setActiveView('braindump')
        }
        return
      }

      // Enter — drill in from overview → board (project must already be set)
      if (e.key === 'Enter' && activeView === 'overview') {
        e.preventDefault()
        if (activeProjectId) setActiveView('board')
        return
      }

      // Escape — go back one level
      if (e.key === 'Escape') {
        if (selectedItemId) { setSelectedItemId(null); return }
        if (activeView === 'board') { setActiveView('overview'); return }
        if (activeView === 'overview') { setActiveView('braindump'); return }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [activeView, activeProjectId, selectedItemId])

  // ── Drill-in handler (from BucketOverview card click) ────────────────────────
  const handleDrillIn = useCallback((projectId) => {
    setActiveProjectId(projectId)
    setActiveView('board')
  }, [])

  const showDetailPanel = selectedItemId && ['board', 'today', 'timeline'].includes(activeView)

  return (
    <div className="h-screen flex overflow-hidden bg-[#080808]">
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
            {activeView === 'braindump' && <BrainDumpView />}
            {activeView === 'overview'  && <BucketOverview onDrillIn={handleDrillIn} />}
            {activeView === 'board'     && <BoardView />}
            {activeView === 'today'     && <TodayView />}
            {activeView === 'timeline'  && <TimelineView />}
            {activeView === 'meetings'  && <MeetingNotesView />}
            {activeView === 'settings'  && <SettingsView />}
          </div>

          {/* Item detail panel */}
          {showDetailPanel && <ItemDetailPanel />}
        </div>

        {/* Breadcrumb status bar */}
        <div className="shrink-0 border-t border-[#00fff7] bg-[#111118] px-4 py-1 flex items-center gap-4">
          <span className="text-xs text-[#ffffff] tracking-widest font-mono font-bold">{breadcrumb}</span>
          <span className="text-xs text-[#cccccc] ml-auto">
            {activeView === 'braindump' && 'Tab/B=overview · N=capture'}
            {activeView === 'overview'  && 'Enter=drill in · Esc=back · Tab/B=brain dump'}
            {activeView === 'board'     && 'Esc=back · Ctrl+F=search'}
          </span>
        </div>
      </div>

      {/* Toast */}
      <Toast />
    </div>
  )
}

export default App
