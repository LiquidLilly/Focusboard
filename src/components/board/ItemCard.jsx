import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import useStore from '../../store/useStore'
import { Badge } from '../ui/Badge'
import { getDueDateColor, formatDueDate, isOverdue, isDueSoon } from '../../utils/dates'
import { GripVertical, Calendar } from 'lucide-react'

export function ItemCard({ item, projectId, bucketId }) {
  const { setSelectedItemId, selectedItemId, toggleSubtask } = useStore()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: { type: 'item', item, projectId, bucketId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const overdue = isOverdue(item.dueDate)
  const dueSoon = isDueSoon(item.dueDate)
  const borderClass = overdue
    ? 'border-l-4 border-l-red-500'
    : dueSoon
    ? 'border-l-4 border-l-amber-400'
    : 'border-l-4 border-l-transparent'

  const isSelected = selectedItemId === item.id
  const doneSubtasks = item.subtasks.filter(s => s.done).length

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-parchment border border-warm-gray shadow-[2px_2px_0px_#c8c4bb] font-mono
        ${borderClass} ${isSelected ? 'ring-1 ring-charcoal' : ''}
        flex items-stretch group cursor-pointer`}
      onClick={() => setSelectedItemId(isSelected ? null : item.id)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        onClick={e => e.stopPropagation()}
        className="flex items-center px-1 text-stone-300 hover:text-stone-500 cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical size={14} />
      </div>

      {/* Content */}
      <div className="flex-1 px-2 py-2 min-w-0">
        {/* Title */}
        <p className={`text-sm font-medium leading-snug text-charcoal ${item.status === 'done' ? 'line-through text-stone-400' : ''}`}>
          {item.title}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1 mt-1.5 items-center">
          <Badge variant={item.type}>{item.type}</Badge>
          {item.priority !== 'medium' && (
            <Badge variant={item.priority}>{item.priority}</Badge>
          )}
        </div>

        {/* Due date + subtask progress */}
        <div className="flex items-center justify-between mt-1.5">
          {item.dueDate && (
            <span className={`text-xs flex items-center gap-0.5 ${getDueDateColor(item.dueDate)}`}>
              <Calendar size={10} />
              {formatDueDate(item.dueDate)}
            </span>
          )}
          {item.subtasks.length > 0 && (
            <span className="text-xs text-stone-400 ml-auto">
              {doneSubtasks}/{item.subtasks.length}
            </span>
          )}
          {item.type === 'goal' && item.progress > 0 && (
            <span className="text-xs text-stone-500">{item.progress}%</span>
          )}
        </div>

        {/* Goal progress bar */}
        {item.type === 'goal' && (
          <div className="mt-1.5 h-1 bg-warm-gray">
            <div
              className="h-full bg-amber-500 transition-all"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
