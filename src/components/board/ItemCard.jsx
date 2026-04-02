import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Star, Pencil, Trash2, CalendarPlus } from 'lucide-react'
import useStore from '../../store/useStore'
import { formatDueDate, isOverdue, isDueSoon } from '../../utils/dates'

const STATUS_COLORS = {
  backlog:     { bg: 'rgba(72,185,199,0.1)',  text: '#48b9c7' },
  todo:        { bg: 'rgba(139,148,158,0.15)', text: '#8b949e' },
  'in-progress':{ bg: 'rgba(157,127,232,0.15)', text: '#9d7fe8' },
  done:        { bg: 'rgba(76,175,130,0.15)', text: '#4caf82' },
}

const PRIORITY_COLORS = {
  low:    '#8b949e',
  medium: '#48b9c7',
  high:   '#e9a84c',
  urgent: '#e05c5c',
}

const SOURCE_COLORS = {
  braindump: { bg: 'rgba(72,185,199,0.1)', text: '#48b9c7' },
  meeting:   { bg: 'rgba(157,127,232,0.12)', text: '#9d7fe8' },
}

export default function TaskCard({ task, isDragOverlay }) {
  const { setSelectedTask, selectedTaskId, updateTask, deleteTask, pinTaskToTomorrow, showToast } = useStore()
  const isSelected = selectedTaskId === task.id

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  const overdue  = isOverdue(task.dueDate)
  const dueSoon  = isDueSoon(task.dueDate)
  const statusC  = STATUS_COLORS[task.status]   || STATUS_COLORS.todo
  const prioC    = PRIORITY_COLORS[task.priority] || '#8b949e'
  const srcColor = SOURCE_COLORS[task.sourceType]

  const doneSubs  = task.subtasks?.filter(s => s.done).length || 0
  const totalSubs = task.subtasks?.length || 0

  function handlePin(e) {
    e.stopPropagation()
    const ok = pinTaskToTomorrow(task.id)
    if (ok) showToast(`"${task.title}" pinned to Tomorrow`)
  }

  const container = isDragOverlay ? 'div' : 'div'

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={{
        ...style,
        background:    task.important ? '#1f1e16' : 'var(--bg-elevated)',
        border:        '1px solid var(--border-subtle)',
        borderLeft:    task.important ? '3px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
        borderRadius:  10,
        cursor:        'default',
        transition:    'box-shadow 0.15s',
        boxShadow:     isSelected ? '0 0 0 1px var(--accent-primary)' : 'none',
        marginBottom:  8,
      }}
      className="group flex items-stretch"
      onClick={() => setSelectedTask(isSelected ? null : task.id)}
    >
      {/* Drag handle */}
      {!isDragOverlay && (
        <div
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
          style={{ padding: '0 4px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'grab', flexShrink: 0 }}
          className="hover:text-text-secondary"
        >
          <GripVertical size={13} />
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, padding: '14px 8px 14px 4px', minWidth: 0 }}>
        {/* Title */}
        <p style={{
          fontSize: 15, fontWeight: 500, lineHeight: 1.4,
          color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          wordBreak: 'break-word',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          marginBottom: 8,
        }}>
          {task.important && <span style={{ marginRight: 4, color: 'var(--accent-orange)' }}>⚡</span>}
          {task.title}
        </p>

        {/* Badges row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {/* Status */}
          <Badge bg={statusC.bg} color={statusC.text}>{task.status}</Badge>

          {/* Priority (hide medium to reduce noise) */}
          {task.priority !== 'medium' && (
            <Badge bg="transparent" color={prioC} border={`1px solid ${prioC}55`}>{task.priority}</Badge>
          )}

          {/* Due date */}
          {task.dueDate && (
            <Badge
              bg="transparent"
              color={overdue ? 'var(--accent-red)' : dueSoon ? 'var(--accent-orange)' : 'var(--text-muted)'}
            >
              {formatDueDate(task.dueDate)}
            </Badge>
          )}

          {/* Source */}
          {task.sourceType && task.sourceType !== 'manual' && srcColor && (
            <Badge bg={srcColor.bg} color={srcColor.text}>
              {task.sourceType === 'braindump' ? 'Brain Dump' : '📋 Meeting'}
            </Badge>
          )}
        </div>

        {/* Subtask progress */}
        {totalSubs > 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            {doneSubs}/{totalSubs} subtasks
          </p>
        )}
      </div>

      {/* Hover actions */}
      {!isDragOverlay && (
        <div
          className="opacity-0 group-hover:opacity-100 flex flex-col justify-start gap-1 pr-2 pt-2"
          style={{ transition: 'opacity 0.15s', flexShrink: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <IconBtn icon={<Star size={11} fill={task.important ? 'var(--accent-orange)' : 'none'} />} color={task.important ? 'var(--accent-orange)' : undefined} onClick={() => updateTask(task.id, { important: !task.important })} title="Flag important" />
          <IconBtn icon={<CalendarPlus size={11} />} onClick={handlePin} title="Pin to Tomorrow" />
          <IconBtn icon={<Trash2 size={11} />} color="var(--accent-red)" onClick={() => deleteTask(task.id)} title="Delete" />
        </div>
      )}
    </div>
  )
}

function Badge({ bg, color, border, children }) {
  return (
    <span style={{
      fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 999,
      background: bg, color, border: border || 'none', lineHeight: 1.6,
    }}>
      {children}
    </span>
  )
}

function IconBtn({ icon, color, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        color: color || 'var(--text-muted)', background: 'none', border: 'none',
        padding: 3, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center',
      }}
      className="hover:text-text-primary"
    >
      {icon}
    </button>
  )
}
