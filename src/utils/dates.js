import { isToday, isYesterday, isPast, differenceInHours, differenceInMinutes,
         differenceInDays, format, parseISO, formatDistanceToNow } from 'date-fns'

export function isOverdue(dateStr) {
  if (!dateStr) return false
  const d = parseDate(dateStr)
  return isPast(d) && !isToday(d)
}

export function isDueSoon(dateStr) {
  if (!dateStr) return false
  const d = parseDate(dateStr)
  const h = differenceInHours(d, new Date())
  return h >= 0 && h <= 48
}

export function formatDueDate(dateStr) {
  if (!dateStr) return null
  const d = parseDate(dateStr)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d')
}

export function formatFullDate(dateStr) {
  if (!dateStr) return ''
  return format(parseDate(dateStr), 'MMM d, yyyy')
}

export function formatRelativeTime(isoStr) {
  if (!isoStr) return ''
  return formatDistanceToNow(parseDate(isoStr), { addSuffix: true })
}

export function getDueDateColor(dateStr) {
  if (!dateStr) return 'text-text-muted'
  if (isOverdue(dateStr)) return 'text-accent-red'
  if (isDueSoon(dateStr)) return 'text-accent-orange'
  return 'text-text-secondary'
}

export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function tomorrowISO() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return format(d, 'yyyy-MM-dd')
}

export function formatPlannerDate(dateStr) {
  if (!dateStr) return ''
  const d = parseDate(dateStr)
  if (isToday(d)) return 'Today'
  const diff = differenceInDays(d, new Date())
  if (diff === 1) return 'Tomorrow'
  return format(d, 'EEEE, MMMM d')
}

function parseDate(s) {
  if (typeof s !== 'string') return s
  // If it's just a date string (yyyy-MM-dd) parse as local noon to avoid timezone shifts
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, day] = s.split('-').map(Number)
    return new Date(y, m - 1, day, 12, 0, 0)
  }
  return parseISO(s)
}
