import { create } from 'zustand'
import { generateId } from '../utils/uuid'
import {
  loadTasks, saveTasks,
  loadSettings, saveSettings,
  loadCapture, saveCapture,
  loadToday, saveToday,
  loadReflect, saveReflect,
  loadOneOnOnes, saveOneOnOnes,
} from '../utils/storage'

// ── Default buckets ───────────────────────────────────────────────────────────
const DEFAULT_BUCKET_NAMES = [
  'Site Startup Support',
  'MES/Automation',
  'Process School',
  'Supply Chain',
  'Data Trending/APR',
  'Process Cleaning',
  'Contamination Control',
]

function makeBucket(name, order) {
  return {
    id: generateId(), name, order, isCore: true, tasks: [],
    statusUpdate: { text: '', updatedAt: null },
    statusHistory: [],
  }
}

// ── Seed data ─────────────────────────────────────────────────────────────────
function createSeedData() {
  const buckets = DEFAULT_BUCKET_NAMES.map((name, i) => makeBucket(name, i))
  const now = new Date().toISOString()
  const soon = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  buckets[0].tasks.push({
    id: generateId(), title: 'Review site startup checklist',
    description: 'Go through the latest version and flag any gaps.',
    status: 'in-progress', priority: 'high', dueDate: soon,
    important: true,
    subtasks: [
      { id: generateId(), title: 'Check equipment readiness', done: false },
      { id: generateId(), title: 'Confirm team sign-offs', done: false },
    ],
    sourceType: 'manual', sourceId: null, createdAt: now, updatedAt: now,
  })

  buckets[1].tasks.push({
    id: generateId(), title: 'Validate MES batch record changes',
    description: '', status: 'todo', priority: 'medium', dueDate: null,
    important: false, subtasks: [], sourceType: 'manual', sourceId: null,
    createdAt: now, updatedAt: now,
  })

  buckets[4].tasks.push({
    id: generateId(), title: 'Update APR trending charts for Q1',
    description: 'Include the new process parameters agreed in March.',
    status: 'backlog', priority: 'low', dueDate: null,
    important: false, subtasks: [], sourceType: 'manual', sourceId: null,
    createdAt: now, updatedAt: now,
  })

  buckets[0].statusUpdate = {
    text: 'IQ/OQ pending cleaning validation sign-off from QA.',
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }

  return { buckets }
}

// ── Store ─────────────────────────────────────────────────────────────────────
const useStore = create((set, get) => {
  // Load or seed tasks
  let tasksData = loadTasks()
  if (!tasksData) {
    tasksData = createSeedData()
    saveTasks(tasksData)
  } else {
    // Migrate: ensure all buckets have statusUpdate + statusHistory + isCore
    tasksData = {
      ...tasksData,
      buckets: tasksData.buckets.map(b => ({
        statusUpdate: { text: '', updatedAt: null },
        statusHistory: [],
        isCore: DEFAULT_BUCKET_NAMES.includes(b.name),
        ...b,
      })),
    }
  }

  const settings   = loadSettings()
  const capture    = loadCapture()
  const today      = loadToday()
  const reflect    = loadReflect()
  const oneonones  = loadOneOnOnes()

  // Reset today state if it's a new day
  const todayDate = new Date().toISOString().slice(0, 10)
  const todayState = today.date === todayDate
    ? today
    : { date: todayDate, intentions: [], howIWantToShowUp: '', meetingNotes: {} }

  return {
    // ── State ─────────────────────────────────────────────────────────────────
    buckets:    tasksData.buckets,
    settings,
    capture,
    today:      todayState,
    reflect,
    oneonones,

    // UI
    activeView:      'today',   // 'today' | 'capture' | 'board' | 'reflect'
    selectedTaskId:  null,
    settingsOpen:    false,
    captureOpen:     false,     // quick capture overlay
    toast:           null,
    toastTimer:      null,
    morningDone:     todayState.intentions.length > 0 || todayState.howIWantToShowUp !== '',

    // ── Navigation ────────────────────────────────────────────────────────────
    setActiveView:   (v)    => set({ activeView: v }),
    setSelectedTask: (id)   => set({ selectedTaskId: id }),
    setSettingsOpen: (open) => set({ settingsOpen: open }),
    setCaptureOpen:  (open) => set({ captureOpen: open }),

    // ── Toast ─────────────────────────────────────────────────────────────────
    showToast(msg) {
      const { toastTimer } = get()
      if (toastTimer) clearTimeout(toastTimer)
      const t = setTimeout(() => set({ toast: null, toastTimer: null }), 3500)
      set({ toast: msg, toastTimer: t })
    },

    // ── Settings ──────────────────────────────────────────────────────────────
    updateSettings(updates) {
      const s = { ...get().settings, ...updates }
      set({ settings: s })
      saveSettings(s)
    },

    // ── Buckets ───────────────────────────────────────────────────────────────
    addBucket(name) {
      const buckets = [...get().buckets, {
        id: generateId(), name, order: get().buckets.length,
        isCore: false, tasks: [],
        statusUpdate: { text: '', updatedAt: null },
        statusHistory: [],
      }]
      set({ buckets })
      saveTasks({ buckets })
    },

    updateBucket(id, updates) {
      const buckets = get().buckets.map(b => b.id === id ? { ...b, ...updates } : b)
      set({ buckets })
      saveTasks({ buckets })
    },

    deleteBucket(id) {
      const buckets = get().buckets.filter(b => b.id !== id)
      set({ buckets })
      saveTasks({ buckets })
    },

    updateBucketStatus(id, text) {
      const now = new Date().toISOString()
      const buckets = get().buckets.map(b => {
        if (b.id !== id) return b
        const prev = b.statusUpdate
        const hadText = prev?.text?.trim()
        const history = hadText
          ? [{ text: prev.text, updatedAt: prev.updatedAt }, ...(b.statusHistory || [])].slice(0, 5)
          : (b.statusHistory || [])
        return { ...b, statusUpdate: { text, updatedAt: now }, statusHistory: history }
      })
      set({ buckets })
      saveTasks({ buckets })
    },

    reorderBuckets(orderedIds) {
      const map = Object.fromEntries(get().buckets.map(b => [b.id, b]))
      const buckets = orderedIds.map(id => map[id]).filter(Boolean)
      set({ buckets })
      saveTasks({ buckets })
    },

    // ── Tasks ─────────────────────────────────────────────────────────────────
    addTask(bucketId, partial = {}) {
      const now = new Date().toISOString()
      const task = {
        id:          generateId(),
        title:       partial.title       || 'New task',
        description: partial.description || '',
        status:      partial.status      || 'todo',
        priority:    partial.priority    || 'medium',
        dueDate:     partial.dueDate     || null,
        important:   partial.important   || false,
        subtasks:    partial.subtasks    || [],
        sourceType:  partial.sourceType  || 'manual',
        sourceId:    partial.sourceId    || null,
        createdAt: now, updatedAt: now,
      }
      const buckets = get().buckets.map(b =>
        b.id === bucketId ? { ...b, tasks: [...b.tasks, task] } : b
      )
      set({ buckets, selectedTaskId: task.id })
      saveTasks({ buckets })
      return task.id
    },

    updateTask(taskId, updates) {
      const buckets = get().buckets.map(b => ({
        ...b,
        tasks: b.tasks.map(t =>
          t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        ),
      }))
      set({ buckets })
      saveTasks({ buckets })
    },

    deleteTask(taskId) {
      const buckets = get().buckets.map(b => ({
        ...b, tasks: b.tasks.filter(t => t.id !== taskId),
      }))
      set({ buckets, selectedTaskId: get().selectedTaskId === taskId ? null : get().selectedTaskId })
      saveTasks({ buckets })
      get().showToast('Task deleted')
    },

    moveTask(taskId, toBucketId, toIndex) {
      let task = null
      let buckets = get().buckets.map(b => {
        const found = b.tasks.find(t => t.id === taskId)
        if (found) task = found
        return { ...b, tasks: b.tasks.filter(t => t.id !== taskId) }
      })
      if (!task) return
      buckets = buckets.map(b => {
        if (b.id !== toBucketId) return b
        const tasks = [...b.tasks]
        tasks.splice(toIndex, 0, task)
        return { ...b, tasks }
      })
      set({ buckets })
      saveTasks({ buckets })
    },

    reorderTasks(bucketId, orderedIds) {
      const buckets = get().buckets.map(b => {
        if (b.id !== bucketId) return b
        const map = Object.fromEntries(b.tasks.map(t => [t.id, t]))
        return { ...b, tasks: orderedIds.map(id => map[id]).filter(Boolean) }
      })
      set({ buckets })
      saveTasks({ buckets })
    },

    getTask(taskId) {
      for (const b of get().buckets) {
        const t = b.tasks.find(t => t.id === taskId)
        if (t) return t
      }
      return null
    },

    getTaskBucket(taskId) {
      for (const b of get().buckets) {
        if (b.tasks.find(t => t.id === taskId)) return b
      }
      return null
    },

    getAllTasks() {
      return get().buckets.flatMap(b => b.tasks.map(t => ({ ...t, bucketId: b.id, bucketName: b.name })))
    },

    // Subtasks
    addSubtask(taskId, title) {
      const task = get().getTask(taskId)
      if (!task) return
      get().updateTask(taskId, {
        subtasks: [...task.subtasks, { id: generateId(), title, done: false }],
      })
    },

    toggleSubtask(taskId, subtaskId) {
      const task = get().getTask(taskId)
      if (!task) return
      get().updateTask(taskId, {
        subtasks: task.subtasks.map(s => s.id === subtaskId ? { ...s, done: !s.done } : s),
      })
    },

    deleteSubtask(taskId, subtaskId) {
      const task = get().getTask(taskId)
      if (!task) return
      get().updateTask(taskId, {
        subtasks: task.subtasks.filter(s => s.id !== subtaskId),
      })
    },

    // ── Capture ───────────────────────────────────────────────────────────────
    addCaptureItem(text, opts = {}) {
      const item = {
        id:        generateId(),
        text,
        important: opts.important  || false,
        dueDate:   opts.dueDate    || null,
        bucketId:  opts.bucketId   || null,
        done:      false,
        createdAt: new Date().toISOString(),
        archivedAt: null,
      }
      const capture = [item, ...get().capture]
      set({ capture })
      saveCapture(capture)
      return item.id
    },

    updateCaptureItem(id, updates) {
      const capture = get().capture.map(i => i.id === id ? { ...i, ...updates } : i)
      set({ capture })
      saveCapture(capture)
    },

    deleteCaptureItem(id) {
      const capture = get().capture.filter(i => i.id !== id)
      set({ capture })
      saveCapture(capture)
    },

    archiveCaptureItem(id) {
      const capture = get().capture.map(i =>
        i.id === id ? { ...i, done: true, archivedAt: new Date().toISOString() } : i
      )
      set({ capture })
      saveCapture(capture)
    },

    sendCaptureToBoard(itemId, bucketId) {
      const item = get().capture.find(i => i.id === itemId)
      if (!item) return
      get().addTask(bucketId, {
        title: item.text,
        important: item.important,
        dueDate: item.dueDate,
        sourceType: 'capture',
        sourceId: itemId,
      })
      get().archiveCaptureItem(itemId)
      get().showToast('Sent to board')
    },

    sendCaptureToToday(itemId) {
      const item = get().capture.find(i => i.id === itemId)
      if (!item) return false
      const result = get().addIntention({ text: item.text, sourceType: 'capture', sourceId: itemId })
      if (result) get().archiveCaptureItem(itemId)
      return result
    },

    // ── Today ─────────────────────────────────────────────────────────────────
    updateToday(updates) {
      const today = { ...get().today, ...updates }
      set({ today })
      saveToday(today)
    },

    completeMorningFlow(intentions, howIWantToShowUp) {
      const date = new Date().toISOString().slice(0, 10)
      const today = {
        ...get().today,
        date,
        intentions: intentions.map(text => ({
          id: generateId(), text,
          sourceType: 'typed', sourceId: null, done: false,
        })),
        howIWantToShowUp,
      }
      set({ today, morningDone: true })
      saveToday(today)
    },

    addIntention(partial) {
      const { today } = get()
      if (today.intentions.length >= 3) {
        get().showToast('3 is enough. Which 3 matter most?')
        return false
      }
      const intention = {
        id:         generateId(),
        text:       partial.text       || '',
        sourceType: partial.sourceType || 'typed',
        sourceId:   partial.sourceId   || null,
        done:       false,
      }
      const updated = { ...today, intentions: [...today.intentions, intention] }
      set({ today: updated, morningDone: true })
      saveToday(updated)
      return true
    },

    toggleIntention(id) {
      const today = {
        ...get().today,
        intentions: get().today.intentions.map(i =>
          i.id === id ? { ...i, done: !i.done } : i
        ),
      }
      set({ today })
      saveToday(today)
    },

    updateMeetingNotes(eventId, updates) {
      const today = {
        ...get().today,
        meetingNotes: {
          ...get().today.meetingNotes,
          [eventId]: { ...(get().today.meetingNotes[eventId] || {}), ...updates },
        },
      }
      set({ today })
      saveToday(today)
    },

    // ── Reflect ───────────────────────────────────────────────────────────────
    addReflectEntry(entry) {
      const item = {
        id:            generateId(),
        type:          entry.type || 'hard-moment',
        title:         entry.title || null,
        userText:      entry.userText || '',
        claudeResponse: entry.claudeResponse || '',
        createdAt:     new Date().toISOString(),
      }
      const reflect = [item, ...get().reflect]
      set({ reflect })
      saveReflect(reflect)
      return item.id
    },

    updateReflectEntry(id, updates) {
      const reflect = get().reflect.map(e => e.id === id ? { ...e, ...updates } : e)
      set({ reflect })
      saveReflect(reflect)
    },

    deleteReflectEntry(id) {
      const reflect = get().reflect.filter(e => e.id !== id)
      set({ reflect })
      saveReflect(reflect)
    },

    // ── One-on-ones ───────────────────────────────────────────────────────────
    addOneOnOne(data) {
      const item = {
        id:                   generateId(),
        personName:           data.personName || '',
        cadence:              data.cadence    || '',
        bringUp:              [],
        unclear:              [],
        howIWantToShowUp:     '',
        linkedMeetingPattern: null,
      }
      const oneonones = [...get().oneonones, item]
      set({ oneonones })
      saveOneOnOnes(oneonones)
      return item.id
    },

    updateOneOnOne(id, updates) {
      const oneonones = get().oneonones.map(o => o.id === id ? { ...o, ...updates } : o)
      set({ oneonones })
      saveOneOnOnes(oneonones)
    },

    deleteOneOnOne(id) {
      const oneonones = get().oneonones.filter(o => o.id !== id)
      set({ oneonones })
      saveOneOnOnes(oneonones)
    },
  }
})

export default useStore
