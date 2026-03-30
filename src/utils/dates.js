import { isToday, isYesterday, isPast, isFuture, differenceInHours, format, parseISO } from 'date-fns'

export function isOverdue(dateStr) {
  if (!dateStr) return false
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
  return isPast(date) && !isToday(date)
}

export function isDueSoon(dateStr) {
  if (!dateStr) return false
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
  const hoursUntil = differenceInHours(date, new Date())
  return hoursUntil >= 0 && hoursUntil <= 48
}

export function isDueToday(dateStr) {
  if (!dateStr) return false
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
  return isToday(date)
}

export function formatDueDate(dateStr) {
  if (!dateStr) return null
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d')
}

export function formatFullDate(dateStr) {
  if (!dateStr) return ''
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
  return format(date, 'MMM d, yyyy')
}

export function getDueDateColor(dateStr) {
  if (!dateStr) return ''
  if (isOverdue(dateStr)) return 'text-[#ff3333]'
  if (isDueSoon(dateStr)) return 'text-[#ffd000]'
  return 'text-[#cccccc]'
}

export function getDueDateBorderColor(dateStr) {
  if (!dateStr) return ''
  if (isOverdue(dateStr)) return 'border-l-[#ff3333]'
  if (isDueSoon(dateStr)) return 'border-l-[#ffd000]'
  return ''
}

export function toISODate(dateStr) {
  if (!dateStr) return null
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    return format(date, 'yyyy-MM-dd')
  } catch {
    return null
  }
}
