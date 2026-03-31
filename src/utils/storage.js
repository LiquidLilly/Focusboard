// Storage keys
const KEYS = {
  TASKS:     'fb_tasks',
  BRAINDUMP: 'fb_braindump',
  MEETINGS:  'fb_meetings',
  SETTINGS:  'fb_settings',
  PLANNER:   'fb_planner',
}

export function loadTasks() {
  try { return JSON.parse(localStorage.getItem(KEYS.TASKS)) } catch { return null }
}
export function saveTasks(data) {
  localStorage.setItem(KEYS.TASKS, JSON.stringify(data))
}

export function loadBrainDump() {
  try { return JSON.parse(localStorage.getItem(KEYS.BRAINDUMP)) || [] } catch { return [] }
}
export function saveBrainDump(items) {
  localStorage.setItem(KEYS.BRAINDUMP, JSON.stringify(items))
}

export function loadMeetings() {
  try { return JSON.parse(localStorage.getItem(KEYS.MEETINGS)) || [] } catch { return [] }
}
export function saveMeetings(meetings) {
  localStorage.setItem(KEYS.MEETINGS, JSON.stringify(meetings))
}

export function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.SETTINGS)) || { apiKey: '', userName: '' }
  } catch {
    return { apiKey: '', userName: '' }
  }
}
export function saveSettings(s) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(s))
}

export function loadPlanner() {
  try { return JSON.parse(localStorage.getItem(KEYS.PLANNER)) || {} } catch { return {} }
}
export function savePlanner(p) {
  localStorage.setItem(KEYS.PLANNER, JSON.stringify(p))
}

export function exportAllData() {
  return JSON.stringify({
    fb_tasks:     loadTasks(),
    fb_braindump: loadBrainDump(),
    fb_meetings:  loadMeetings(),
    fb_settings:  loadSettings(),
    fb_planner:   loadPlanner(),
    exportedAt:   new Date().toISOString(),
  }, null, 2)
}

export function importAllData(jsonString) {
  const d = JSON.parse(jsonString)
  if (d.fb_tasks)     saveTasks(d.fb_tasks)
  if (d.fb_braindump) saveBrainDump(d.fb_braindump)
  if (d.fb_meetings)  saveMeetings(d.fb_meetings)
  if (d.fb_settings)  saveSettings(d.fb_settings)
  if (d.fb_planner)   savePlanner(d.fb_planner)
}

export function clearAllData() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}
