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
    task: 'bg-[#00fff710] text-[#00fff7] border-[#00fff730]',
    todo: 'bg-[#ff00ff10] text-[#ff00ff] border-[#ff00ff30]',
    goal: 'bg-[#ffb00010] text-[#ffb000] border-[#ffb00030]',
  }

  return (
    <div className="flex-1 overflow-auto p-4 font-mono bg-[#0d0d0d]">
      <div className="max-w-5xl mx-auto">
        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-base font-bold text-[#00fff7] uppercase tracking-widest">Timeline</h1>
          <div className="flex items-center gap-3">
            <div className="flex border border-[#1e1e3a]">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-xs font-mono ${viewMode === 'week' ? 'bg-[#00fff7] text-[#0d0d0d] font-bold' : 'bg-[#0d0d0d] text-[#444466] hover:text-[#e0e0e0]'}`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-xs font-mono border-l border-[#1e1e3a] ${viewMode === 'month' ? 'bg-[#00fff7] text-[#0d0d0d] font-bold' : 'bg-[#0d0d0d] text-[#444466] hover:text-[#e0e0e0]'}`}
              >
                Month
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => navigate(-1)} className="p-1 hover:bg-[#1a1a2e] border border-[#1e1e3a] text-[#444466] hover:text-[#e0e0e0]">
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm px-2 text-[#e0e0e0]">
                {viewMode === 'week'
                  ? `${format(days[0], 'MMM d')} – ${format(days[days.length - 1], 'MMM d, yyyy')}`
                  : format(currentDate, 'MMMM yyyy')}
              </span>
              <button onClick={() => navigate(1)} className="p-1 hover:bg-[#1a1a2e] border border-[#1e1e3a] text-[#444466] hover:text-[#e0e0e0]">
                <ChevronRight size={14} />
              </button>
            </div>
            <button onClick={() => setCurrentDate(new Date())} className="text-xs font-mono border border-[#1e1e3a] px-2 py-1 text-[#444466] hover:text-[#00fff7] hover:border-[#00fff730]">
              Today
            </button>
          </div>
        </div>

        {/* Overdue column */}
        {overdueItems.length > 0 && (
          <div className="mb-4 border border-[#ff202030] bg-[#ff202010]">
            <div className="px-3 py-1.5 bg-[#ff202015] border-b border-[#ff202030]">
              <span className="text-xs font-semibold text-[#ff2020] uppercase tracking-wide">⚠ Overdue — {overdueItems.length}</span>
            </div>
            <div className="p-2 flex flex-wrap gap-1.5">
              {overdueItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className="text-xs font-mono border border-[#ff202030] bg-[#0d0d0d] text-[#ff2020] px-2 py-1 hover:bg-[#ff202015] text-left"
                >
                  <div className="font-medium truncate max-w-48">{item.title}</div>
                  <div className="text-[#444466]">{item.projectName}</div>
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
                className={`min-h-24 border ${today ? 'border-[#00fff730]' : 'border-[#1e1e3a]'} bg-[#0d0d0d]`}
              >
                <div className={`px-2 py-1 text-xs font-mono border-b
                  ${today ? 'bg-[#00fff715] border-[#00fff730] text-[#00fff7]' : 'bg-[#1a1a2e] text-[#444466] border-[#1e1e3a]'}`}>
                  <div>{format(day, 'EEE')}</div>
                  <div className={`font-semibold ${today ? 'text-[#00fff7]' : 'text-[#e0e0e0]'}`}>{format(day, 'd')}</div>
                </div>
                <div className="p-1 flex flex-col gap-1">
                  {dayItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`w-full text-left text-xs font-mono px-1.5 py-1 border truncate hover:opacity-80 ${itemColorMap[item.type] || 'bg-[#1a1a2e] text-[#e0e0e0] border-[#1e1e3a]'}`}
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
