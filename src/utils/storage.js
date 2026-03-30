const KEYS = {
  PROJECTS: 'focusboard_projects',
  BRAINDUMP: 'focusboard_braindump',
  MEETINGS: 'focusboard_meetings',
  SETTINGS: 'focusboard_settings',
  NUDGES_DATE: 'focusboard_nudges_last_generated',
  NUDGES_DATA: 'focusboard_nudges_data',
}

export function loadProjects() {
  try {
    const raw = localStorage.getItem(KEYS.PROJECTS)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveProjects(projects) {
  localStorage.setItem(KEYS.PROJECTS, JSON.stringify(projects))
}

export function loadBrainDump() {
  try {
    const raw = localStorage.getItem(KEYS.BRAINDUMP)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveBrainDump(items) {
  localStorage.setItem(KEYS.BRAINDUMP, JSON.stringify(items))
}

export function loadMeetings() {
  try {
    const raw = localStorage.getItem(KEYS.MEETINGS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveMeetings(meetings) {
  localStorage.setItem(KEYS.MEETINGS, JSON.stringify(meetings))
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS)
    return raw ? JSON.parse(raw) : { apiKey: '', userName: '', focusMode: false }
  } catch {
    return { apiKey: '', userName: '', focusMode: false }
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings))
}

export function loadNudgesDate() {
  return localStorage.getItem(KEYS.NUDGES_DATE) || null
}

export function saveNudgesDate(date) {
  localStorage.setItem(KEYS.NUDGES_DATE, date)
}

export function loadNudgesData() {
  try {
    const raw = localStorage.getItem(KEYS.NUDGES_DATA)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveNudgesData(nudges) {
  localStorage.setItem(KEYS.NUDGES_DATA, JSON.stringify(nudges))
}

export function exportAllData() {
  const data = {
    focusboard_projects: loadProjects(),
    focusboard_braindump: loadBrainDump(),
    focusboard_meetings: loadMeetings(),
    focusboard_settings: loadSettings(),
    exportedAt: new Date().toISOString(),
  }
  return JSON.stringify(data, null, 2)
}

export function importAllData(jsonString) {
  const data = JSON.parse(jsonString)
  if (data.focusboard_projects) saveProjects(data.focusboard_projects)
  if (data.focusboard_braindump) saveBrainDump(data.focusboard_braindump)
  if (data.focusboard_meetings) saveMeetings(data.focusboard_meetings)
  if (data.focusboard_settings) saveSettings(data.focusboard_settings)
}

export function clearAllData() {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key))
}
