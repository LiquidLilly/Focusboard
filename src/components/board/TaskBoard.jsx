import { useState } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import useStore from '../../store/useStore'
import BucketColumn from './BucketColumn'
import TaskCard from './TaskCard'
import { Plus } from 'lucide-react'

export default function TaskBoard() {
  const { buckets, moveTask, reorderTasks, reorderBuckets, addBucket } = useStore()
  const [activeTask,   setActiveTask]   = useState(null)
  const [activeColumn, setActiveColumn] = useState(null)
  const [addingBucket, setAddingBucket] = useState(false)
  const [newBucketName, setNewBucketName] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragStart(event) {
    const { active } = event
    // Column drag — data.type is set to 'column' in BucketColumn's useSortable
    if (active.data.current?.type === 'column') {
      const col = buckets.find(b => b.id === active.id)
      if (col) { setActiveColumn(col); return }
    }
    // Task drag
    for (const b of buckets) {
      const t = b.tasks.find(t => t.id === active.id)
      if (t) { setActiveTask({ ...t, bucketId: b.id, bucketName: b.name }); return }
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveTask(null)
    setActiveColumn(null)
    if (!over || active.id === over.id) return

    // ── Column reorder ────────────────────────────────────────────────────────
    if (active.data.current?.type === 'column') {
      const oldIndex = buckets.findIndex(b => b.id === active.id)
      const newIndex = buckets.findIndex(b => b.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        reorderBuckets(arrayMove(buckets, oldIndex, newIndex).map(b => b.id))
      }
      return
    }

    // ── Task reorder / move ───────────────────────────────────────────────────
    let srcBucketId = null
    for (const b of buckets) {
      if (b.tasks.find(t => t.id === active.id)) { srcBucketId = b.id; break }
    }
    if (!srcBucketId) return

    let destBucketId = null
    let destIndex    = 0

    const overBucket = buckets.find(b => b.id === over.id)
    if (overBucket) {
      destBucketId = over.id
      destIndex    = overBucket.tasks.length
    } else {
      for (const b of buckets) {
        const idx = b.tasks.findIndex(t => t.id === over.id)
        if (idx !== -1) { destBucketId = b.id; destIndex = idx; break }
      }
    }

    if (!destBucketId) return

    if (srcBucketId === destBucketId) {
      const bucket  = buckets.find(b => b.id === srcBucketId)
      const oldIdx  = bucket.tasks.findIndex(t => t.id === active.id)
      if (oldIdx === destIndex) return
      const ids = bucket.tasks.map(t => t.id)
      ids.splice(oldIdx, 1)
      ids.splice(destIndex, 0, active.id)
      reorderTasks(srcBucketId, ids)
    } else {
      moveTask(active.id, destBucketId, destIndex)
    }
  }

  function handleAddBucket() {
    const name = newBucketName.trim()
    if (!name) return
    addBucket(name)
    setNewBucketName('')
    setAddingBucket(false)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full overflow-x-auto overflow-y-hidden" style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'inline-flex', flex: '1 1 auto', gap: 12, padding: '12px 16px', minWidth: 'min-content', maxWidth: '100%', alignItems: 'flex-start' }}>
        <SortableContext items={buckets.map(b => b.id)} strategy={horizontalListSortingStrategy}>
          {buckets.map(bucket => (
            <BucketColumn key={bucket.id} bucket={bucket} />
          ))}
        </SortableContext>

        {/* Add bucket */}
        <div style={{ flex: '1 1 260px', minWidth: 220, maxWidth: 320 }}>
          {addingBucket ? (
            <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
              <input
                autoFocus
                value={newBucketName}
                onChange={e => setNewBucketName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddBucket(); if (e.key === 'Escape') setAddingBucket(false) }}
                placeholder="Bucket name"
                style={{ padding: '6px 10px', fontSize: 13, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', outline: 'none' }}
              />
              <div className="flex gap-2">
                <button onClick={handleAddBucket} style={{ flex: 1, padding: '5px 10px', background: 'var(--accent-primary)', color: '#0d1117', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Add</button>
                <button onClick={() => setAddingBucket(false)} style={{ flex: 1, padding: '5px 10px', background: 'none', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingBucket(true)}
              className="flex items-center gap-2 w-full p-3 rounded-xl"
              style={{ background: 'transparent', border: '1px dashed var(--border-default)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
            >
              <Plus size={14} /> Add Bucket
            </button>
          )}
        </div>
        </div>
      </div>

      {/* Drag ghost overlay */}
      <DragOverlay>
        {activeColumn && (
          <div
            className="flex flex-col shrink-0 rounded-xl"
            style={{
              minWidth: 220, maxWidth: 320,
              height: 120,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-accent)',
              boxShadow: '0 8px 32px rgba(72,185,199,0.22)',
              opacity: 0.85,
              overflow: 'hidden',
            }}
          >
            <div
              className="flex items-center justify-between px-3 py-3"
              style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'grabbing' }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {activeColumn.name}
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, background: 'var(--bg-elevated)', color: 'var(--text-muted)', borderRadius: 999, padding: '2px 8px' }}>
                {activeColumn.tasks.length}
              </span>
            </div>
          </div>
        )}
        {activeTask && (
          <div style={{ opacity: 0.5, boxShadow: '0 8px 24px rgba(72,185,199,0.27)' }}>
            <TaskCard task={activeTask} isDragOverlay />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
