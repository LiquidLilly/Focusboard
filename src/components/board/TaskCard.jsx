import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Star, Trash2 } from 'lucide-react'
import useStore from '../../store/useStore'
import { formatDueDate, isOverdue, isDueSoon } from '../../utils/dates'

const STATUS_COLORS = {
  backlog:       { bg: 'rgba(91,156,246,0.1)',   text: 'var(--accent)' },
  todo:          { bg: 'rgba(139,149,168,0.15)',  text: 'var(--text-secondary)' },
  'in-progress': { bg: 'rgba(157,127,232,0.15)', text: 'var(--accent-purple)' },
  done:          { bg: 'rgba(76,175,130,0.15)',   text: 'var(--accent-green)' },
}

const PRIORITY_COLORS = {
  low:    'var(--text-muted)',
  medium: 'var(--accent)',
  high:   'var(--accent-warm)',
  urgent: 'var(--accent-red)',
}

const SOURCE_COLORS = {
  capture: { bg: 'rgba(91,156,246,0.1)',   text: 'var(--accent)' },
  meeting: { bg: 'rgba(157,127,232,0.12)', text: 'var(--accent-purple)' },
}

export default function TaskCard({ task, isDragOverlay }) {
  const { setSelectedTask, selectedTaskId, updateTask, deleteTask } = useStore()
  const isSelected = selectedTaskId === task.id

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const overdue  = isOverdue(task.dueDate)
  const dueSoon  = isDueSoon(task.dueDate)
  const statusC  = STATUS_COLORS[task.status]   || STATUS_COLORS.todo
  const prioC    = PRIORITY_COLORS[task.priority] || 'var(--text-muted)'
  const srcColor = SOURCE_COLORS[task.sourceType]

  const doneSubs  = task.subtasks?.filter(s => s.done).length || 0
  const totalSubs = task.subtasks?.length || 0

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        background:   task.important ? '#1e1d14' : 'var(--bg-raised)',
        border:       '1px solid var(--border-subtle)',
        borderLeft:   task.important ? '3px solid var(--accent-warm)' : '1px solid var(--border-subtle)',
        borderRadius: 10,
        cursor:       'default',
        boxShadow:    isSelected ? `0 0 0 1.5px var(--accent)` : 'none',
        marginBottom: 8,
        display:      'flex',
        alignItems:   'stretch',
      }}
      className="group"
      onClick={() => setSelectedTask(isSelected ? null : task.id)}
    >
      {/* Drag handle */}
      {!isDragOverlay && (
        <div
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
          style={{ padding: '0 4px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'grab', flexShrink: 0, opacity: 0, transition: 'opacity 0.15s' }}
          className="group-hover:opacity-100"
        >
          <GripVertical size={13} />
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, padding: '12px 8px 12px 4px', minWidth: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 500, lineHeight: 1.4,
          color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          wordBreak: 'break-word',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          marginBottom: 8,
        }}>
          {task.important && <span style={{ marginRight: 4, color: 'var(--accent-warm)' }}>⚡</span>}
          {task.title}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: totalSubs > 0 ? 6 : 0 }}>
          <Badge bg={statusC.bg} color={statusC.text}>{task.status}</Badge>

          {task.priority !== 'medium' && (
            <Badge bg="transparent" color={prioC} border={`1px solid ${prioC}55`}>{task.priority}</Badge>
          )}

          {task.dueDate && (
            <Badge
              bg="transparent"
              color={overdue ? 'var(--accent-red)' : dueSoon ? 'var(--accent-warm)' : 'var(--text-muted)'}
            >
              {formatDueDate(task.dueDate)}
            </Badge>
          )}

          {task.sourceType && task.sourceType !== 'manual' && srcColor && (
            <Badge bg={srcColor.bg} color={srcColor.text}>
              {task.sourceType === 'capture' ? 'Capture' : 'Meeting'}
            </Badge>
          )}
        </div>

        {totalSubs > 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {doneSubs}/{totalSubs} subtasks
          </p>
        )}
      </div>

      {/* Hover actions */}
      {!isDragOverlay && (
        <div
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 2, paddingRight: 8, paddingTop: 8, flexShrink: 0, opacity: 0, transition: 'opacity 0.15s' }}
          className="group-hover:opacity-100"
          onClick={e => e.stopPropagation()}
        >
          <IconBtn
            icon={<Star size={11} fill={task.important ? 'var(--accent-warm)' : 'none'} />}
            color={task.important ? 'var(--accent-warm)' : undefined}
            onClick={() => updateTask(task.id, { important: !task.important })}
            title="Flag important"
          />
          <IconBtn
            icon={<Trash2 size={11} />}
            color="var(--accent-red)"
            onClick={() => deleteTask(task.id)}
            title="Delete"
          />
        </div>
      )}
    </div>
  )
}

function Badge({ bg, color, border, children }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999,
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
    >
      {icon}
    </button>
  )
}
