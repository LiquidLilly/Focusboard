import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import useStore from '../../store/useStore'
import { Badge } from '../ui/Badge'
import { isOverdue, isDueSoon, formatDueDate } from '../../utils/dates'
import { GripVertical, Calendar } from 'lucide-react'

export function ItemCard({ item, projectId, bucketId }) {
  const { setSelectedItemId, selectedItemId } = useStore()

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
    opacity: isDragging ? 0.3 : 1,
  }

  const overdue  = isOverdue(item.dueDate)
  const dueSoon  = isDueSoon(item.dueDate)
  const borderL  = overdue ? 'border-l-[#ff3333]' : dueSoon ? 'border-l-[#ffd000]' : 'border-l-[#444466]'
  const isSelected = selectedItemId === item.id
  const doneSubtasks = item.subtasks.filter(s => s.done).length

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-[#111118] border border-[#444466] border-l-4 font-mono
        ${borderL}
        ${isSelected ? 'border-[#00fff7] shadow-[0_0_8px_#00fff730]' : 'hover:border-[#00fff7]'}
        flex items-stretch group cursor-pointer transition-all`}
      onClick={() => setSelectedItemId(isSelected ? null : item.id)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        onClick={e => e.stopPropagation()}
        className="flex items-center px-1 text-[#444466] hover:text-[#cccccc] cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical size={13} />
      </div>

      {/* Content */}
      <div className="flex-1 px-2 py-2 min-w-0">
        <p className={`text-sm font-medium leading-snug
          ${item.status === 'done' ? 'line-through text-[#666688]' : 'text-[#ffffff] font-bold'}`}>
          {item.title}
        </p>

        <div className="flex flex-wrap gap-1 mt-1.5 items-center">
          <Badge variant={item.type}>{item.type}</Badge>
          {item.priority !== 'medium' && (
            <Badge variant={item.priority}>{item.priority}</Badge>
          )}
        </div>

        <div className="flex items-center justify-between mt-1.5">
          {item.dueDate && (
            <span className={`text-xs flex items-center gap-0.5
              ${overdue ? 'text-[#ff3333]' : dueSoon ? 'text-[#ffd000]' : 'text-[#cccccc]'}`}>
              <Calendar size={10} />
              {formatDueDate(item.dueDate)}
            </span>
          )}
          {item.subtasks.length > 0 && (
            <span className="text-xs text-[#cccccc] ml-auto">
              {doneSubtasks}/{item.subtasks.length}
            </span>
          )}
          {item.type === 'goal' && item.progress > 0 && (
            <span className="text-xs text-[#cccccc]">{item.progress}%</span>
          )}
        </div>

        {/* Goal progress bar */}
        {item.type === 'goal' && (
          <div className="mt-1.5 h-1 bg-[#444466]">
            <div
              className="h-full bg-[#ffd000] transition-all"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
