import { useState } from 'react'
import useStore from '../../store/useStore'
import { Button } from '../ui/Button'
import {
  LayoutGrid, Sun, Calendar, FileText, Zap, Settings,
  Plus, ChevronDown, ChevronRight, Trash2, Edit3, Check, X
} from 'lucide-react'

const PROJECT_COLORS = [
  '#7b97b0', '#8aab8a', '#c49a4a', '#c4897a',
  '#9b8fb0', '#7aab9b', '#c4a47a', '#9ba77b',
]

export function Sidebar() {
  const {
    projects, activeView, activeProjectId, settings,
    setActiveView, setActiveProjectId,
    addProject, updateProject, deleteProject,
    getProjectStats,
  } = useStore()

  const [expandedProjects, setExpandedProjects] = useState(true)
  const [addingProject, setAddingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0])
  const [editingProjectId, setEditingProjectId] = useState(null)
  const [editingName, setEditingName] = useState('')

  const navItems = [
    { id: 'board', label: 'Board', icon: LayoutGrid },
    { id: 'today', label: 'Today', icon: Sun },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'meetings', label: 'Meeting Notes', icon: FileText },
    { id: 'braindump', label: 'Brain Dump', icon: Zap },
  ]

  const visibleNavItems = settings.focusMode
    ? navItems.filter(n => n.id === 'today')
    : navItems

  function handleAddProject() {
    if (!newProjectName.trim()) return
    addProject(newProjectName.trim(), newProjectColor)
    setNewProjectName('')
    setNewProjectColor(PROJECT_COLORS[0])
    setAddingProject(false)
    setActiveView('board')
  }

  function handleEditProject(e, project) {
    e.stopPropagation()
    setEditingProjectId(project.id)
    setEditingName(project.name)
  }

  function handleSaveEdit(projectId) {
    if (editingName.trim()) updateProject(projectId, { name: editingName.trim() })
    setEditingProjectId(null)
  }

  function handleDeleteProject(e, projectId) {
    e.stopPropagation()
    if (window.confirm('Delete this project and all its items?')) {
      deleteProject(projectId)
    }
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-charcoal text-parchment flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-3 border-b border-stone-700">
        <div className="font-mono font-bold text-lg tracking-tight">FocusBoard</div>
        <div className="font-mono text-xs text-stone-400">personal planner</div>
      </div>

      {/* Nav */}
      <nav className="px-2 py-3 flex flex-col gap-0.5">
        {visibleNavItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id)}
            className={`flex items-center gap-2.5 px-2.5 py-1.5 text-sm font-mono w-full text-left transition-colors
              ${activeView === id
                ? 'bg-stone-700 text-parchment'
                : 'text-stone-400 hover:text-parchment hover:bg-stone-800'
              }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </nav>

      {/* Projects section */}
      {!settings.focusMode && (
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          <div className="flex items-center justify-between px-2 py-1.5">
            <button
              className="flex items-center gap-1 text-xs font-mono text-stone-400 hover:text-parchment uppercase tracking-wider"
              onClick={() => setExpandedProjects(!expandedProjects)}
            >
              {expandedProjects ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              Projects
            </button>
            <button
              className="text-stone-400 hover:text-parchment"
              onClick={() => setAddingProject(true)}
              title="New project"
            >
              <Plus size={12} />
            </button>
          </div>

          {expandedProjects && (
            <div className="flex flex-col gap-0.5">
              {projects.map(project => {
                const stats = getProjectStats(project.id)
                const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
                const isActive = activeProjectId === project.id && activeView === 'board'

                return (
                  <div
                    key={project.id}
                    className={`group relative flex items-center gap-2 px-2.5 py-1.5 cursor-pointer font-mono text-sm transition-colors
                      ${isActive ? 'bg-stone-700 text-parchment' : 'text-stone-400 hover:text-parchment hover:bg-stone-800'}`}
                    onClick={() => { setActiveProjectId(project.id); setActiveView('board') }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />

                    {editingProjectId === project.id ? (
                      <input
                        autoFocus
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit(project.id)
                          if (e.key === 'Escape') setEditingProjectId(null)
                        }}
                        onBlur={() => handleSaveEdit(project.id)}
                        onClick={e => e.stopPropagation()}
                        className="flex-1 bg-stone-600 text-parchment text-xs px-1 py-0.5 outline-none"
                      />
                    ) : (
                      <span className="flex-1 truncate text-xs">{project.name}</span>
                    )}

                    {editingProjectId !== project.id && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <button onClick={e => handleEditProject(e, project)} className="text-stone-400 hover:text-parchment">
                          <Edit3 size={10} />
                        </button>
                        <button onClick={e => handleDeleteProject(e, project.id)} className="text-stone-400 hover:text-red-400">
                          <Trash2 size={10} />
                        </button>
                      </div>
                    )}

                    {/* Progress bar */}
                    {stats.total > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-700">
                        <div
                          className="h-full bg-stone-400 transition-all"
                          style={{ width: `${pct}%`, backgroundColor: project.color }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}

              {addingProject && (
                <div className="px-2.5 py-2 bg-stone-800 flex flex-col gap-2">
                  <input
                    autoFocus
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddProject()
                      if (e.key === 'Escape') setAddingProject(false)
                    }}
                    placeholder="Project name…"
                    className="bg-stone-700 text-parchment text-xs font-mono px-2 py-1 outline-none border border-stone-600 placeholder-stone-500"
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    {PROJECT_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewProjectColor(color)}
                        className={`w-4 h-4 rounded-full border-2 ${newProjectColor === color ? 'border-parchment' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={handleAddProject} className="text-xs font-mono text-parchment bg-stone-600 hover:bg-stone-500 px-2 py-0.5 flex items-center gap-1">
                      <Check size={10} /> Add
                    </button>
                    <button onClick={() => setAddingProject(false)} className="text-xs font-mono text-stone-400 hover:text-parchment">
                      <X size={10} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Settings link */}
      <div className="px-2 py-2 border-t border-stone-700">
        <button
          onClick={() => setActiveView('settings')}
          className={`flex items-center gap-2.5 px-2.5 py-1.5 text-sm font-mono w-full text-left transition-colors
            ${activeView === 'settings' ? 'bg-stone-700 text-parchment' : 'text-stone-400 hover:text-parchment hover:bg-stone-800'}`}
        >
          <Settings size={14} />
          Settings
        </button>
      </div>
    </aside>
  )
}
