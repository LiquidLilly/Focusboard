import { useState } from 'react'
import useStore from '../../store/useStore'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, parseISO, isPast } from 'date-fns'
import { isOverdue } from '../../utils/dates'
import { Badge } from '../ui/Badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function TimelineView() {
  const { getAllItems, setSelectedItemId } = useStore()
  const [viewMode, setViewMode] = useState('week')
  const [currentDate, setCurrentDate] = useState(new Date())

  const allItems = getAllItems().filter(i => i.dueDate && i.status !== 'done')
  const overdueItems = allItems.filter(i => isOverdue(i.dueDate))

  let days = []
  if (viewMode === 'week') {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    const end = endOfWeek(currentDate, { weekStartsOn: 1 })
    days = eachDayOfInterval({ start, end })
  } else {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    days = eachDayOfInterval({ start, end })
  }

  function getItemsForDay(day) {
    return allItems.filter(item => {
      if (!item.dueDate) return false
      return isSameDay(parseISO(item.dueDate), day)
    })
  }

  function navigate(dir) {
    const d = new Date(currentDate)
    if (viewMode === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setMonth(d.getMonth() + dir)
    setCurrentDate(d)
  }

  const itemColorMap = { task: 'bg-blue-100 text-blue-800 border-blue-200', todo: 'bg-green-100 text-green-800 border-green-200', goal: 'bg-amber-100 text-amber-800 border-amber-200' }

  return (
    <div className="flex-1 overflow-auto p-4 font-mono">
      <div className="max-w-5xl mx-auto">
        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-charcoal">Timeline</h1>
          <div className="flex items-center gap-3">
            <div className="flex border border-warm-gray">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-xs font-mono ${viewMode === 'week' ? 'bg-charcoal text-parchment' : 'bg-parchment text-charcoal hover:bg-stone-100'}`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-xs font-mono border-l border-warm-gray ${viewMode === 'month' ? 'bg-charcoal text-parchment' : 'bg-parchment text-charcoal hover:bg-stone-100'}`}
              >
                Month
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => navigate(-1)} className="p-1 hover:bg-stone-100 border border-warm-gray">
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm px-2">
                {viewMode === 'week'
                  ? `${format(days[0], 'MMM d')} – ${format(days[days.length - 1], 'MMM d, yyyy')}`
                  : format(currentDate, 'MMMM yyyy')}
              </span>
              <button onClick={() => navigate(1)} className="p-1 hover:bg-stone-100 border border-warm-gray">
                <ChevronRight size={14} />
              </button>
            </div>
            <button onClick={() => setCurrentDate(new Date())} className="text-xs font-mono border border-warm-gray px-2 py-1 hover:bg-stone-100">
              Today
            </button>
          </div>
        </div>

        {/* Overdue column */}
        {overdueItems.length > 0 && (
          <div className="mb-4 border border-red-200 bg-red-50">
            <div className="px-3 py-1.5 bg-red-100 border-b border-red-200">
              <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">⚠ Overdue — {overdueItems.length}</span>
            </div>
            <div className="p-2 flex flex-wrap gap-1.5">
              {overdueItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className="text-xs font-mono border border-red-300 bg-parchment text-red-800 px-2 py-1 hover:bg-red-100 text-left"
                >
                  <div className="font-medium truncate max-w-48">{item.title}</div>
                  <div className="text-stone-400">{item.projectName}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Day columns */}
        <div className={`grid gap-2 ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'}`}>
          {days.map(day => {
            const dayItems = getItemsForDay(day)
            const today = isToday(day)

            return (
              <div
                key={day.toISOString()}
                className={`min-h-24 border ${today ? 'border-charcoal bg-stone-50' : 'border-warm-gray bg-parchment'}`}
              >
                <div className={`px-2 py-1 text-xs font-mono border-b ${today ? 'bg-charcoal text-parchment border-charcoal' : 'bg-stone-100 text-stone-600 border-warm-gray'}`}>
                  <div>{format(day, 'EEE')}</div>
                  <div className={`font-semibold ${today ? 'text-parchment' : 'text-charcoal'}`}>{format(day, 'd')}</div>
                </div>
                <div className="p-1 flex flex-col gap-1">
                  {dayItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`w-full text-left text-xs font-mono px-1.5 py-1 border truncate hover:opacity-80 ${itemColorMap[item.type] || 'bg-stone-100 text-stone-700 border-stone-200'}`}
                      style={{ borderLeftColor: item.projectColor, borderLeftWidth: '3px' }}
                    >
                      {item.title}
                    </button>
                  ))}
                  {dayItems.length === 0 && <div className="h-2" />}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
