import { create } from 'zustand'
import { generateId } from '../utils/uuid'
import {
  loadTasks, saveTasks,
  loadBrainDump, saveBrainDump,
  loadMeetings, saveMeetings,
  loadSettings, saveSettings,
  loadPlanner, savePlanner,
} from '../utils/storage'
import { tomorrowISO } from '../utils/dates'

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
    id: generateId(), name, order, tasks: [],
    statusUpdate: { text: '', updatedAt: null },
    statusHistory: [],
  }
}

// ── Seed data ─────────────────────────────────────────────────────────────────
function createSeedData() {
  const buckets = DEFAULT_BUCKET_NAMES.map((name, i) => makeBucket(name, i))

  // Seed tasks
  const now = new Date().toISOString()
  const soon = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  buckets[0].tasks.push({
    id: generateId(), title: 'Review site startup checklist',
    description: 'Go through the latest version and flag any gaps.',
    status: 'in-progress', priority: 'high', dueDate: soon,
    important: true, subtasks: [
      { id: generateId(), title: 'Check equipment readiness', done: false },
      { id: generateId(), title: 'Confirm team sign-offs', done: false },
    ],
    sourceType: 'manual', meetingId: null, createdAt: now, updatedAt: now,
  })

  buckets[1].tasks.push({
    id: generateId(), title: 'Validate MES batch record changes',
    description: '',
    status: 'todo', priority: 'medium', dueDate: null,
    important: false, subtasks: [],
    sourceType: 'manual', meetingId: null, createdAt: now, updatedAt: now,
  })

  buckets[4].tasks.push({
    id: generateId(), title: 'Update APR trending charts for Q1',
    description: 'Include the new process parameters agreed in March.',
    status: 'backlog', priority: 'low', dueDate: null,
    important: false, subtasks: [],
    sourceType: 'manual', meetingId: null, createdAt: now, updatedAt: now,
  })

  return { buckets }
}

function createSeedBrainDump() {
  const now = new Date().toISOString()
  return [
    {
      id: generateId(), text: 'Need to follow up with QA about the cleaning SOP — they mentioned a revision was coming',
      important: true, createdAt: now,
    },
    {
      id: generateId(), text: 'Contamination RCA meeting scheduled — check if action items from last time were closed',
      important: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: generateId(), text: 'Ask about the timeline for Process School module 3 materials',
      important: false, createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
  ]
}

function createSeedMeeting(buckets) {
  const meetingId = generateId()
  const taskId = generateId()
  const now = new Date().toISOString()

  // Add the linked task to bucket 5 (Process Cleaning)
  const task = {
    id: taskId, title: 'Review updated cleaning validation protocol',
    description: 'From the March 28 Cross-Functional meeting. QA expects comments by EOW.',
    status: 'todo', priority: 'high',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    important: true, subtasks: [],
    sourceType: 'meeting', meetingId,
    createdAt: now, updatedAt: now,
  }
  buckets[5].tasks.push(task)

  const meeting = {
    id: meetingId,
    title: 'Cross-Functional Site Readiness Review',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    attendees: 'Sarah (QA), Mike (Engineering), Priya (Supply Chain), Raj (MES)',
    rawNotes: `Discussed site startup timeline. QA flagged cleaning validation protocol needs review before IQ/OQ. Mike to check equipment calibration schedule. Supply chain confirmed resin delivery for April 12. Priya mentioned the vendor audit is next month — unclear if anyone has started prep. Raj said the MES batch record changes are 80% done but need sign-off from QA before go-live.`,
    processed: true,
    extractedData: {
      actionItems: [{ id: generateId(), text: 'Review updated cleaning validation protocol', bucketName: 'Process Cleaning' }],
      decisions: ['Site startup IQ/OQ cannot proceed until cleaning validation is signed off'],
      followUps: ['Check equipment calibration schedule with Mike', 'Confirm MES batch record QA sign-off timeline with Raj'],
      deadlines: ['Resin delivery April 12', 'Vendor audit next month'],
      mightHaveMissed: ['Vendor audit prep was flagged as uncertain — no owner was assigned. This could land on you if no one else picks it up.', 'MES sign-off dependency on QA could delay go-live — worth flagging now rather than waiting.'],
      questionsToAsk: ['Who owns the vendor audit preparation?', 'What is the exact deadline for MES QA sign-off?'],
    },
    createdAt: now,
  }

  return { meeting, buckets }
}

// ── Store ─────────────────────────────────────────────────────────────────────
const useStore = create((set, get) => {
  // Load or seed
  let tasksData = loadTasks()
  let brainDump  = loadBrainDump()
  let meetings   = loadMeetings()
  const settings = loadSettings()
  const planner  = loadPlanner()

  if (!tasksData) {
    const seed = createSeedData()
    const bdSeed = createSeedBrainDump()
    const { meeting, buckets } = createSeedMeeting(seed.buckets)
    tasksData = { buckets }
    brainDump = bdSeed
    meetings = [meeting]
    saveTasks(tasksData)
    saveBrainDump(brainDump)
    saveMeetings(meetings)
  } else {
    // Migrate existing buckets that predate statusUpdate/statusHistory fields
    tasksData = {
      ...tasksData,
      buckets: tasksData.buckets.map(b => ({
        statusUpdate: { text: '', updatedAt: null },
        statusHistory: [],
        ...b,
      })),
    }
  }

  return {
    // ── State ─────────────────────────────────────────────────────────────────
    buckets:   tasksData.buckets,
    brainDump,
    meetings,
    settings,
    planner,

    // UI state
    activeView:       'board',   // 'board' | 'planner'
    leftPanelOpen:    true,
    rightPanelOpen:   true,
    selectedTaskId:   null,
    settingsOpen:     false,
    activeMeetingId:  null,
    toast:            null,
    toastTimer:       null,

    // ── Navigation ────────────────────────────────────────────────────────────
    setActiveView: (v)       => set({ activeView: v }),
    setLeftPanel:  (open)    => set({ leftPanelOpen: open }),
    setRightPanel: (open)    => set({ rightPanelOpen: open }),
    setSelectedTask: (id)    => set({ selectedTaskId: id }),
    setSettingsOpen: (open)  => set({ settingsOpen: open }),
    setActiveMeeting: (id)   => set({ activeMeetingId: id }),

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
      const buckets = [...get().buckets, makeBucket(name, get().buckets.length)]
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
        id: generateId(),
        title:       partial.title       || 'New task',
        description: partial.description || '',
        status:      partial.status      || 'todo',
        priority:    partial.priority    || 'medium',
        dueDate:     partial.dueDate     || null,
        important:   partial.important   || false,
        subtasks:    partial.subtasks    || [],
        sourceType:  partial.sourceType  || 'manual',
        meetingId:   partial.meetingId   || null,
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
        ...b,
        tasks: b.tasks.filter(t => t.id !== taskId),
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

    // Helper: find task by id
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

    // ── Brain Dump ────────────────────────────────────────────────────────────
    addBrainDumpItem(text) {
      const item = { id: generateId(), text, important: false, createdAt: new Date().toISOString() }
      const brainDump = [item, ...get().brainDump]
      set({ brainDump })
      saveBrainDump(brainDump)
      return item.id
    },

    updateBrainDumpItem(id, updates) {
      const brainDump = get().brainDump.map(i => i.id === id ? { ...i, ...updates } : i)
      set({ brainDump })
      saveBrainDump(brainDump)
    },

    deleteBrainDumpItem(id) {
      const brainDump = get().brainDump.filter(i => i.id !== id)
      set({ brainDump })
      saveBrainDump(brainDump)
    },

    sendBrainDumpToBoard(itemId, bucketId) {
      const item = get().brainDump.find(i => i.id === itemId)
      if (!item) return
      get().addTask(bucketId, { title: item.text, sourceType: 'braindump', important: item.important })
      get().deleteBrainDumpItem(itemId)
      get().showToast('Sent to board')
    },

    // ── Meetings ──────────────────────────────────────────────────────────────
    saveMeeting(meeting) {
      const existing = get().meetings.findIndex(m => m.id === meeting.id)
      const meetings = existing >= 0
        ? get().meetings.map(m => m.id === meeting.id ? meeting : m)
        : [meeting, ...get().meetings]
      set({ meetings })
      saveMeetings(meetings)
      return meeting
    },

    deleteMeeting(id) {
      const meetings = get().meetings.filter(m => m.id !== id)
      set({ meetings })
      saveMeetings(meetings)
    },

    addTaskFromMeeting(bucketId, taskData) {
      const id = get().addTask(bucketId, { ...taskData, sourceType: 'meeting' })
      get().showToast('Added to board')
      return id
    },

    // ── Planner ───────────────────────────────────────────────────────────────
    getPlannerDay(date) {
      return get().planner[date] || []
    },

    setPlannerSlots(date, slots) {
      const planner = { ...get().planner, [date]: slots }
      set({ planner })
      savePlanner(planner)
    },

    addPlannerSlot(date, slotData) {
      const slots = get().getPlannerDay(date)
      if (slots.length >= 5) {
        get().showToast("Tomorrow is full — remove a slot first")
        return false
      }
      const slot = {
        id:          generateId(),
        date,
        order:       slots.length + 1,
        title:       slotData.title       || '',
        bucketName:  slotData.bucketName  || null,
        taskId:      slotData.taskId      || null,
        important:   slotData.important   || false,
        done:        false,
        timeContext: slotData.timeContext  || null,
      }
      const updated = [...slots, slot]
      const planner = { ...get().planner, [date]: updated }
      set({ planner })
      savePlanner(planner)
      return slot.id
    },

    updatePlannerSlot(date, slotId, updates) {
      const slots = get().getPlannerDay(date).map(s =>
        s.id === slotId ? { ...s, ...updates } : s
      )
      // If marking done and slot has a linked task, update that task too
      if (updates.done === true) {
        const slot = get().getPlannerDay(date).find(s => s.id === slotId)
        if (slot?.taskId) {
          get().updateTask(slot.taskId, { status: 'done' })
        }
      }
      const planner = { ...get().planner, [date]: slots }
      set({ planner })
      savePlanner(planner)
    },

    deletePlannerSlot(date, slotId) {
      const slots = get().getPlannerDay(date).filter(s => s.id !== slotId)
      const planner = { ...get().planner, [date]: slots }
      set({ planner })
      savePlanner(planner)
    },

    pinTaskToTomorrow(taskId) {
      const task = get().getTask(taskId)
      if (!task) return false
      const bucket = get().getTaskBucket(taskId)
      const date = tomorrowISO()
      return get().addPlannerSlot(date, {
        title:      task.title,
        bucketName: bucket?.name || null,
        taskId,
        important:  task.important,
      })
    },
  }
})

export default useStore
