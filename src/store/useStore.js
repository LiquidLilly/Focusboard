import { create } from 'zustand'
import { generateId } from '../utils/uuid'
import {
  loadProjects, saveProjects,
  loadBrainDump, saveBrainDump,
  loadMeetings, saveMeetings,
  loadSettings, saveSettings,
} from '../utils/storage'
import { format } from 'date-fns'

// ─── Seed Data ───────────────────────────────────────────────────────────────
function createSeedData() {
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7)

  const todoId = generateId()
  const inProgId = generateId()
  const doneId = generateId()

  return [{
    id: generateId(),
    name: 'Getting Started',
    color: '#7b97b0',
    createdAt: new Date().toISOString(),
    buckets: [
      {
        id: todoId,
        name: 'To Do',
        order: 0,
        items: [
          {
            id: generateId(),
            type: 'task',
            title: 'Explore the Board view',
            description: 'Drag items between buckets, click to open details, and try the AI Assist button.',
            status: 'todo',
            priority: 'medium',
            dueDate: format(tomorrow, 'yyyy-MM-dd'),
            assignee: '',
            subtasks: [
              { id: generateId(), title: 'Open an item by clicking it', done: false },
              { id: generateId(), title: 'Drag an item to another bucket', done: false },
            ],
            progress: 0,
            pinnedToday: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: generateId(),
            type: 'goal',
            title: 'Set up my first real project',
            description: 'Create a project for something you\'re actually working on.',
            status: 'todo',
            priority: 'high',
            dueDate: format(nextWeek, 'yyyy-MM-dd'),
            assignee: '',
            subtasks: [],
            progress: 0,
            pinnedToday: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
      {
        id: inProgId,
        name: 'In Progress',
        order: 1,
        items: [
          {
            id: generateId(),
            type: 'task',
            title: 'Add your Claude API key in Settings',
            description: 'Go to Settings (bottom of sidebar) and paste your API key to unlock AI features.',
            status: 'in-progress',
            priority: 'urgent',
            dueDate: format(today, 'yyyy-MM-dd'),
            assignee: '',
            subtasks: [
              { id: generateId(), title: 'Open Settings', done: false },
              { id: generateId(), title: 'Paste API key and test connection', done: false },
            ],
            progress: 0,
            pinnedToday: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: generateId(),
            type: 'todo',
            title: 'Try the Meeting Notes processor',
            description: 'Paste raw meeting notes and let Claude extract action items.',
            status: 'in-progress',
            priority: 'low',
            dueDate: format(yesterday, 'yyyy-MM-dd'),
            assignee: '',
            subtasks: [],
            progress: 0,
            pinnedToday: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
      {
        id: doneId,
        name: 'Done',
        order: 2,
        items: [
          {
            id: generateId(),
            type: 'todo',
            title: 'Launch FocusBoard',
            description: 'You did it.',
            status: 'done',
            priority: 'medium',
            dueDate: format(today, 'yyyy-MM-dd'),
            assignee: '',
            subtasks: [],
            progress: 100,
            pinnedToday: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    ],
  }]
}

// ─── Store ────────────────────────────────────────────────────────────────────
const useStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  projects: loadProjects() || createSeedData(),
  brainDump: loadBrainDump(),
  meetings: loadMeetings(),
  settings: loadSettings(),
  activeView: 'board',
  activeProjectId: null,
  selectedItemId: null,
  toast: null,
  toastTimer: null,
  undoStack: [], // { type, payload } for undo actions

  // ── Init ────────────────────────────────────────────────────────────────────
  init() {
    const { projects } = get()
    if (projects.length > 0 && !get().activeProjectId) {
      set({ activeProjectId: projects[0].id })
    }
  },

  // ── Navigation ─────────────────────────────────────────────────────────────
  setActiveView(view) { set({ activeView: view }) },
  setActiveProjectId(id) { set({ activeProjectId: id }) },
  setSelectedItemId(id) { set({ selectedItemId: id }) },

  // ── Toast ───────────────────────────────────────────────────────────────────
  showToast(message, undoFn = null) {
    const { toastTimer } = get()
    if (toastTimer) clearTimeout(toastTimer)
    const timer = setTimeout(() => set({ toast: null, toastTimer: null }), 5000)
    set({ toast: { message, undoFn }, toastTimer: timer })
  },
  dismissToast() {
    const { toastTimer } = get()
    if (toastTimer) clearTimeout(toastTimer)
    set({ toast: null, toastTimer: null })
  },

  // ── Settings ────────────────────────────────────────────────────────────────
  updateSettings(updates) {
    const settings = { ...get().settings, ...updates }
    set({ settings })
    saveSettings(settings)
  },

  // ── Projects ────────────────────────────────────────────────────────────────
  addProject(name, color = '#7b97b0') {
    const newProject = {
      id: generateId(),
      name,
      color,
      createdAt: new Date().toISOString(),
      buckets: [
        { id: generateId(), name: 'Backlog', order: 0, items: [] },
        { id: generateId(), name: 'To Do', order: 1, items: [] },
        { id: generateId(), name: 'In Progress', order: 2, items: [] },
        { id: generateId(), name: 'Done', order: 3, items: [] },
      ],
    }
    const projects = [...get().projects, newProject]
    set({ projects, activeProjectId: newProject.id })
    saveProjects(projects)
  },

  updateProject(projectId, updates) {
    const projects = get().projects.map(p =>
      p.id === projectId ? { ...p, ...updates } : p
    )
    set({ projects })
    saveProjects(projects)
  },

  deleteProject(projectId) {
    const projects = get().projects.filter(p => p.id !== projectId)
    const activeProjectId = projects.length > 0 ? projects[0].id : null
    set({ projects, activeProjectId })
    saveProjects(projects)
  },

  // ── Buckets ─────────────────────────────────────────────────────────────────
  addBucket(projectId, name) {
    const projects = get().projects.map(p => {
      if (p.id !== projectId) return p
      const maxOrder = p.buckets.reduce((m, b) => Math.max(m, b.order), -1)
      return {
        ...p,
        buckets: [...p.buckets, {
          id: generateId(),
          name,
          order: maxOrder + 1,
          items: [],
        }],
      }
    })
    set({ projects })
    saveProjects(projects)
  },

  updateBucket(projectId, bucketId, updates) {
    const projects = get().projects.map(p => {
      if (p.id !== projectId) return p
      return {
        ...p,
        buckets: p.buckets.map(b => b.id === bucketId ? { ...b, ...updates } : b),
      }
    })
    set({ projects })
    saveProjects(projects)
  },

  deleteBucket(projectId, bucketId) {
    const projects = get().projects.map(p => {
      if (p.id !== projectId) return p
      return { ...p, buckets: p.buckets.filter(b => b.id !== bucketId) }
    })
    set({ projects })
    saveProjects(projects)
  },

  reorderBuckets(projectId, orderedBucketIds) {
    const projects = get().projects.map(p => {
      if (p.id !== projectId) return p
      const bucketMap = Object.fromEntries(p.buckets.map(b => [b.id, b]))
      const buckets = orderedBucketIds.map((id, idx) => ({ ...bucketMap[id], order: idx }))
      return { ...p, buckets }
    })
    set({ projects })
    saveProjects(projects)
  },

  // ── Items ───────────────────────────────────────────────────────────────────
  addItem(projectId, bucketId, partial = {}) {
    const newItem = {
      id: generateId(),
      type: partial.type || 'task',
      title: partial.title || 'New item',
      description: partial.description || '',
      status: partial.status || 'todo',
      priority: partial.priority || 'medium',
      dueDate: partial.dueDate || null,
      assignee: partial.assignee || '',
      subtasks: partial.subtasks || [],
      progress: partial.progress || 0,
      pinnedToday: partial.pinnedToday || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const projects = get().projects.map(p => {
      if (p.id !== projectId) return p
      return {
        ...p,
        buckets: p.buckets.map(b =>
          b.id === bucketId ? { ...b, items: [...b.items, newItem] } : b
        ),
      }
    })
    set({ projects, selectedItemId: newItem.id })
    saveProjects(projects)
    return newItem.id
  },

  updateItem(itemId, updates) {
    const projects = get().projects.map(p => ({
      ...p,
      buckets: p.buckets.map(b => ({
        ...b,
        items: b.items.map(item =>
          item.id === itemId
            ? { ...item, ...updates, updatedAt: new Date().toISOString() }
            : item
        ),
      })),
    }))
    set({ projects })
    saveProjects(projects)
  },

  deleteItem(itemId) {
    // Find item for undo
    let deletedItem = null
    let deletedProjectId = null
    let deletedBucketId = null
    for (const p of get().projects) {
      for (const b of p.buckets) {
        const item = b.items.find(i => i.id === itemId)
        if (item) { deletedItem = item; deletedProjectId = p.id; deletedBucketId = b.id }
      }
    }

    const projects = get().projects.map(p => ({
      ...p,
      buckets: p.buckets.map(b => ({
        ...b,
        items: b.items.filter(i => i.id !== itemId),
      })),
    }))
    set({ projects })
    saveProjects(projects)

    if (deletedItem) {
      get().showToast(`"${deletedItem.title}" deleted`, () => {
        get().restoreItem(deletedProjectId, deletedBucketId, deletedItem)
      })
    }
  },

  restoreItem(projectId, bucketId, item) {
    const projects = get().projects.map(p => {
      if (p.id !== projectId) return p
      return {
        ...p,
        buckets: p.buckets.map(b =>
          b.id === bucketId ? { ...b, items: [...b.items, item] } : b
        ),
      }
    })
    set({ projects })
    saveProjects(projects)
  },

  moveItem(itemId, targetProjectId, targetBucketId, targetIndex) {
    let movedItem = null
    // Remove from source
    let projects = get().projects.map(p => ({
      ...p,
      buckets: p.buckets.map(b => {
        const item = b.items.find(i => i.id === itemId)
        if (item) movedItem = item
        return { ...b, items: b.items.filter(i => i.id !== itemId) }
      }),
    }))
    if (!movedItem) return

    // Insert into target
    projects = projects.map(p => {
      if (p.id !== targetProjectId) return p
      return {
        ...p,
        buckets: p.buckets.map(b => {
          if (b.id !== targetBucketId) return b
          const items = [...b.items]
          items.splice(targetIndex, 0, movedItem)
          return { ...b, items }
        }),
      }
    })
    set({ projects })
    saveProjects(projects)
  },

  reorderItems(projectId, bucketId, orderedItemIds) {
    const projects = get().projects.map(p => {
      if (p.id !== projectId) return p
      return {
        ...p,
        buckets: p.buckets.map(b => {
          if (b.id !== bucketId) return b
          const itemMap = Object.fromEntries(b.items.map(i => [i.id, i]))
          const items = orderedItemIds.map(id => itemMap[id]).filter(Boolean)
          return { ...b, items }
        }),
      }
    })
    set({ projects })
    saveProjects(projects)
  },

  // ── Subtasks ─────────────────────────────────────────────────────────────────
  addSubtask(itemId, title) {
    get().updateItem(itemId, {
      subtasks: [
        ...(get().getItem(itemId)?.subtasks || []),
        { id: generateId(), title, done: false },
      ],
    })
  },

  toggleSubtask(itemId, subtaskId) {
    const item = get().getItem(itemId)
    if (!item) return
    get().updateItem(itemId, {
      subtasks: item.subtasks.map(s =>
        s.id === subtaskId ? { ...s, done: !s.done } : s
      ),
    })
  },

  deleteSubtask(itemId, subtaskId) {
    const item = get().getItem(itemId)
    if (!item) return
    get().updateItem(itemId, {
      subtasks: item.subtasks.filter(s => s.id !== subtaskId),
    })
  },

  // ── Helpers ──────────────────────────────────────────────────────────────────
  getItem(itemId) {
    for (const p of get().projects) {
      for (const b of p.buckets) {
        const item = b.items.find(i => i.id === itemId)
        if (item) return item
      }
    }
    return null
  },

  getItemLocation(itemId) {
    for (const p of get().projects) {
      for (const b of p.buckets) {
        const item = b.items.find(i => i.id === itemId)
        if (item) return { project: p, bucket: b, item }
      }
    }
    return null
  },

  getAllItems() {
    const items = []
    for (const p of get().projects) {
      for (const b of p.buckets) {
        for (const i of b.items) {
          items.push({ ...i, projectId: p.id, projectName: p.name, projectColor: p.color, bucketId: b.id, bucketName: b.name })
        }
      }
    }
    return items
  },

  getProjectStats(projectId) {
    const p = get().projects.find(pr => pr.id === projectId)
    if (!p) return { total: 0, done: 0 }
    let total = 0, done = 0
    for (const b of p.buckets) {
      for (const i of b.items) {
        total++
        if (i.status === 'done') done++
      }
    }
    return { total, done }
  },

  // ── Brain Dump ───────────────────────────────────────────────────────────────
  addBrainDumpItem(text) {
    const newItem = {
      id: generateId(),
      text,
      createdAt: new Date().toISOString(),
    }
    const brainDump = [newItem, ...get().brainDump]
    set({ brainDump })
    saveBrainDump(brainDump)
    return newItem.id
  },

  deleteBrainDumpItem(id) {
    const deleted = get().brainDump.find(i => i.id === id)
    const brainDump = get().brainDump.filter(i => i.id !== id)
    set({ brainDump })
    saveBrainDump(brainDump)
    if (deleted) {
      get().showToast(`"${deleted.text.slice(0, 40)}..." removed`, () => {
        const bd = [deleted, ...get().brainDump]
        set({ brainDump: bd })
        saveBrainDump(bd)
      })
    }
  },

  updateBrainDumpItem(id, updates) {
    const brainDump = get().brainDump.map(i => i.id === id ? { ...i, ...updates } : i)
    set({ brainDump })
    saveBrainDump(brainDump)
  },

  // ── Meetings ─────────────────────────────────────────────────────────────────
  saveMeeting(meeting) {
    const existing = get().meetings.findIndex(m => m.id === meeting.id)
    let meetings
    if (existing >= 0) {
      meetings = get().meetings.map(m => m.id === meeting.id ? meeting : m)
    } else {
      meetings = [meeting, ...get().meetings]
    }
    set({ meetings })
    saveMeetings(meetings)
    return meeting
  },

  deleteMeeting(id) {
    const meetings = get().meetings.filter(m => m.id !== id)
    set({ meetings })
    saveMeetings(meetings)
  },
}))

export default useStore
