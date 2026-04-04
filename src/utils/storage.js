// Storage keys
const KEYS = {
  TASKS:      'fb_tasks',
  SETTINGS:   'fb_settings',
  CAPTURE:    'fb_capture',
  TODAY:      'fb_today',
  REFLECT:    'fb_reflect',
  ONEONONES:  'fb_oneonones',
}

// ── Tasks / Buckets ──────────────────────────────────────────────────────────
export function loadTasks() {
  try { return JSON.parse(localStorage.getItem(KEYS.TASKS)) } catch { return null }
}
export function saveTasks(data) {
  localStorage.setItem(KEYS.TASKS, JSON.stringify(data))
}

// ── Settings ─────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  apiKey: '',
  userName: 'Wes',
  aiProvider: 'databricks',
  databricks: { pat: '', clientId: '', clientSecret: '', tenantId: '' },
  msGraph: { accessToken: null, tokenExpiry: null },
}

export function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEYS.SETTINGS))
    if (!stored) return { ...DEFAULT_SETTINGS }
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      databricks: { ...DEFAULT_SETTINGS.databricks, ...(stored.databricks || {}) },
      msGraph:    { ...DEFAULT_SETTINGS.msGraph,    ...(stored.msGraph    || {}) },
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}
export function saveSettings(s) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(s))
}

// ── Capture ───────────────────────────────────────────────────────────────────
export function loadCapture() {
  try { return JSON.parse(localStorage.getItem(KEYS.CAPTURE)) || [] } catch { return [] }
}
export function saveCapture(items) {
  localStorage.setItem(KEYS.CAPTURE, JSON.stringify(items))
}

// ── Today ─────────────────────────────────────────────────────────────────────
const DEFAULT_TODAY = { date: null, intentions: [], howIWantToShowUp: '', meetingNotes: {} }

export function loadToday() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEYS.TODAY))
    if (!stored) return { ...DEFAULT_TODAY }
    return { ...DEFAULT_TODAY, ...stored }
  } catch {
    return { ...DEFAULT_TODAY }
  }
}
export function saveToday(data) {
  localStorage.setItem(KEYS.TODAY, JSON.stringify(data))
}

// ── Reflect ───────────────────────────────────────────────────────────────────
export function loadReflect() {
  try { return JSON.parse(localStorage.getItem(KEYS.REFLECT)) || [] } catch { return [] }
}
export function saveReflect(entries) {
  localStorage.setItem(KEYS.REFLECT, JSON.stringify(entries))
}

// ── One-on-ones ───────────────────────────────────────────────────────────────
export function loadOneOnOnes() {
  try { return JSON.parse(localStorage.getItem(KEYS.ONEONONES)) || [] } catch { return [] }
}
export function saveOneOnOnes(items) {
  localStorage.setItem(KEYS.ONEONONES, JSON.stringify(items))
}

// ── Export / Import / Clear ───────────────────────────────────────────────────
export function exportAllData() {
  return JSON.stringify({
    fb_tasks:     loadTasks(),
    fb_settings:  loadSettings(),
    fb_capture:   loadCapture(),
    fb_today:     loadToday(),
    fb_reflect:   loadReflect(),
    fb_oneonones: loadOneOnOnes(),
    exportedAt:   new Date().toISOString(),
  }, null, 2)
}

export function importAllData(jsonString) {
  const d = JSON.parse(jsonString)
  if (d.fb_tasks)     saveTasks(d.fb_tasks)
  if (d.fb_settings)  saveSettings(d.fb_settings)
  if (d.fb_capture)   saveCapture(d.fb_capture)
  if (d.fb_today)     saveToday(d.fb_today)
  if (d.fb_reflect)   saveReflect(d.fb_reflect)
  if (d.fb_oneonones) saveOneOnOnes(d.fb_oneonones)
}

export function clearAllData() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}
