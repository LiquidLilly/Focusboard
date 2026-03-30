import { callClaude } from './useAI'
import { loadNudgesDate, saveNudgesDate, loadNudgesData, saveNudgesData } from '../utils/storage'
import { format, parseISO, differenceInDays, isBefore } from 'date-fns'

export async function generateNudges(projects) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const lastGen = loadNudgesDate()

  // Only regenerate once per day
  if (lastGen === today) {
    return loadNudgesData()
  }

  const now = new Date()
  const flaggedItems = []

  for (const project of projects) {
    for (const bucket of project.buckets) {
      for (const item of bucket.items) {
        if (item.status === 'done') continue

        const dueDate = item.dueDate ? parseISO(item.dueDate) : null
        const hoursUntilDue = dueDate ? (dueDate - now) / 36e5 : Infinity
        const daysSinceUpdate = differenceInDays(now, parseISO(item.updatedAt))
        const daysSinceCreated = differenceInDays(now, parseISO(item.createdAt))

        // Flag: due within 48h but no subtasks
        if (hoursUntilDue >= 0 && hoursUntilDue <= 48 && item.subtasks.length === 0 && item.type === 'task') {
          flaggedItems.push({ reason: 'due_soon_no_subtasks', item, project })
        }

        // Flag: in progress for 14+ days
        if (item.status === 'in-progress' && daysSinceUpdate >= 14) {
          flaggedItems.push({ reason: 'stale_in_progress', item, project })
        }

        // Flag: goal with 0% progress and deadline within 30 days
        if (item.type === 'goal' && item.progress === 0 && dueDate && differenceInDays(dueDate, now) <= 30 && differenceInDays(dueDate, now) >= 0) {
          flaggedItems.push({ reason: 'goal_no_progress', item, project })
        }

        // Flag: review/approve items due soon
        if (dueDate && hoursUntilDue >= 0 && hoursUntilDue <= 72 &&
            (item.title.toLowerCase().includes('review') || item.title.toLowerCase().includes('approve'))) {
          flaggedItems.push({ reason: 'review_due_soon', item, project })
        }
      }

      // Flag: project with no activity in 10+ days
      const lastActivity = bucket.items.reduce((latest, item) => {
        const d = parseISO(item.updatedAt)
        return d > latest ? d : latest
      }, new Date(0))

      if (bucket.items.length > 0 && differenceInDays(now, lastActivity) >= 10) {
        flaggedItems.push({ reason: 'project_inactive', project, bucket })
      }
    }
  }

  if (flaggedItems.length === 0) {
    saveNudgesDate(today)
    saveNudgesData([])
    return []
  }

  // Build prompt from flagged items (limit to most important)
  const itemsForPrompt = flaggedItems.slice(0, 8)
  const promptLines = itemsForPrompt.map(f => {
    if (f.reason === 'due_soon_no_subtasks') return `- "${f.item.title}" (in ${f.project.name}) is due within 48 hours but has no subtasks defined`
    if (f.reason === 'stale_in_progress') return `- "${f.item.title}" (in ${f.project.name}) has been "In Progress" for 14+ days`
    if (f.reason === 'goal_no_progress') return `- Goal "${f.item.title}" (in ${f.project.name}) has 0% progress and is due within 30 days`
    if (f.reason === 'review_due_soon') return `- "${f.item.title}" (in ${f.project.name}) needs someone else's review/approval and is due within 72 hours`
    if (f.reason === 'project_inactive') return `- Project "${f.project.name}" hasn't had any activity in 10+ days`
    return ''
  }).filter(Boolean)

  const prompt = `Based on these flagged items from my task board, generate up to 3 short, direct nudges (one sentence each) that are most important for me to notice right now. Be specific, not generic. No bullet points, just 3 separate lines.

Flagged items:
${promptLines.join('\n')}

Format: One nudge per line, each under 100 characters, direct and actionable.`

  try {
    const response = await callClaude(prompt)
    const nudges = response.split('\n')
      .map(line => line.trim().replace(/^[-•*\d.]+\s*/, ''))
      .filter(line => line.length > 10)
      .slice(0, 3)
      .map(text => ({ id: Math.random().toString(36).slice(2), text }))

    saveNudgesDate(today)
    saveNudgesData(nudges)
    return nudges
  } catch {
    return []
  }
}
