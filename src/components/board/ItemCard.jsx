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
  const borderL  = overdue ? 'border-l-[#ff2020]' : dueSoon ? 'border-l-[#ffb000]' : 'border-l-[#1e1e3a]'
  const isSelected = selectedItemId === item.id
  const doneSubtasks = item.subtasks.filter(s => s.done).length

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-[#0d0d0d] border border-[#1e1e3a] border-l-4 font-mono
        ${borderL}
        ${isSelected ? 'border-[#00fff730] shadow-[0_0_8px_#00fff715]' : 'hover:border-[#1e1e3a]'}
        flex items-stretch group cursor-pointer transition-all`}
      onClick={() => setSelectedItemId(isSelected ? null : item.id)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        onClick={e => e.stopPropagation()}
        className="flex items-center px-1 text-[#1e1e3a] hover:text-[#444466] cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical size={13} />
      </div>

      {/* Content */}
      <div className="flex-1 px-2 py-2 min-w-0">
        <p className={`text-sm font-medium leading-snug
          ${item.status === 'done' ? 'line-through text-[#444466]' : 'text-[#e0e0e0]'}`}>
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
              ${overdue ? 'text-[#ff2020]' : dueSoon ? 'text-[#ffb000]' : 'text-[#444466]'}`}>
              <Calendar size={10} />
              {formatDueDate(item.dueDate)}
            </span>
          )}
          {item.subtasks.length > 0 && (
            <span className="text-xs text-[#444466] ml-auto">
              {doneSubtasks}/{item.subtasks.length}
            </span>
          )}
          {item.type === 'goal' && item.progress > 0 && (
            <span className="text-xs text-[#444466]">{item.progress}%</span>
          )}
        </div>

        {/* Goal progress bar */}
        {item.type === 'goal' && (
          <div className="mt-1.5 h-1 bg-[#1e1e3a]">
            <div
              className="h-full bg-[#ffb000] transition-all"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
