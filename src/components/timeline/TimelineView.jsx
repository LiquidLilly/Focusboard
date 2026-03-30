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

  const itemColorMap = {
    task: 'bg-[#00fff715] text-[#00fff7] border-[#00fff7]',
    todo: 'bg-[#ff00ff15] text-[#ff00ff] border-[#ff00ff]',
    goal: 'bg-[#ffd00015] text-[#ffd000] border-[#ffd000]',
  }

  return (
    <div className="flex-1 overflow-auto p-4 font-mono bg-[#080808]">
      <div className="max-w-5xl mx-auto">
        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-base font-bold text-[#00fff7] uppercase tracking-widest">Timeline</h1>
          <div className="flex items-center gap-3">
            <div className="flex border border-[#444466]">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-xs font-mono ${viewMode === 'week' ? 'bg-[#00fff7] text-[#080808] font-bold' : 'bg-[#080808] text-[#cccccc] hover:text-[#ffffff]'}`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-xs font-mono border-l border-[#444466] ${viewMode === 'month' ? 'bg-[#00fff7] text-[#080808] font-bold' : 'bg-[#080808] text-[#cccccc] hover:text-[#ffffff]'}`}
              >
                Month
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => navigate(-1)} className="p-1 hover:bg-[#111118] border border-[#444466] text-[#cccccc] hover:text-[#ffffff]">
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm px-2 text-[#ffffff] font-bold">
                {viewMode === 'week'
                  ? `${format(days[0], 'MMM d')} – ${format(days[days.length - 1], 'MMM d, yyyy')}`
                  : format(currentDate, 'MMMM yyyy')}
              </span>
              <button onClick={() => navigate(1)} className="p-1 hover:bg-[#111118] border border-[#444466] text-[#cccccc] hover:text-[#ffffff]">
                <ChevronRight size={14} />
              </button>
            </div>
            <button onClick={() => setCurrentDate(new Date())} className="text-xs font-mono border border-[#444466] px-2 py-1 text-[#cccccc] hover:text-[#00fff7] hover:border-[#00fff7]">
              Today
            </button>
          </div>
        </div>

        {/* Overdue column */}
        {overdueItems.length > 0 && (
          <div className="mb-4 border border-[#ff3333] bg-[#ff333315]">
            <div className="px-3 py-1.5 bg-[#ff333320] border-b border-[#ff3333]">
              <span className="text-xs font-bold text-[#ff3333] uppercase tracking-wide">⚠ Overdue — {overdueItems.length}</span>
            </div>
            <div className="p-2 flex flex-wrap gap-1.5">
              {overdueItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className="text-xs font-mono border border-[#ff3333] bg-[#111118] text-[#ff3333] px-2 py-1 hover:bg-[#ff333320] text-left font-bold"
                >
                  <div className="font-bold truncate max-w-48">{item.title}</div>
                  <div className="text-[#cccccc]">{item.projectName}</div>
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
                className={`min-h-24 border ${today ? 'border-[#00fff7]' : 'border-[#444466]'} bg-[#111118]`}
              >
                <div className={`px-2 py-1 text-xs font-mono border-b
                  ${today ? 'bg-[#00fff715] border-[#00fff7] text-[#00fff7]' : 'bg-[#080808] text-[#cccccc] border-[#444466]'}`}>
                  <div>{format(day, 'EEE')}</div>
                  <div className={`font-bold ${today ? 'text-[#00fff7]' : 'text-[#ffffff]'}`}>{format(day, 'd')}</div>
                </div>
                <div className="p-1 flex flex-col gap-1">
                  {dayItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`w-full text-left text-xs font-mono font-bold px-1.5 py-1 border truncate hover:opacity-80 ${itemColorMap[item.type] || 'bg-[#111118] text-[#ffffff] border-[#444466]'}`}
                      style={{ borderLeftColor: item.projectColor, borderLeftWidth: '2px' }}
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
