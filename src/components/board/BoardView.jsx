import { useState } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import useStore from '../../store/useStore'
import BucketColumn from './BucketColumn'
import TaskCard from './TaskCard'
import { Plus } from 'lucide-react'

export default function BoardView() {
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
    if (active.data.current?.type === 'column') {
      const col = buckets.find(b => b.id === active.id)
      if (col) { setActiveColumn(col); return }
    }
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

    // Column reorder
    if (active.data.current?.type === 'column') {
      const oldIndex = buckets.findIndex(b => b.id === active.id)
      const newIndex = buckets.findIndex(b => b.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        reorderBuckets(arrayMove(buckets, oldIndex, newIndex).map(b => b.id))
      }
      return
    }

    // Task reorder / move
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
      const bucket = buckets.find(b => b.id === srcBucketId)
      const oldIdx = bucket.tasks.findIndex(t => t.id === active.id)
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
    <div style={{ height: 'calc(100vh - 48px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '16px',
          gap: 12,
          alignItems: 'flex-start',
        }}>
          <SortableContext items={buckets.map(b => b.id)} strategy={horizontalListSortingStrategy}>
            {buckets.map(bucket => (
              <BucketColumn key={bucket.id} bucket={bucket} />
            ))}
          </SortableContext>

          {/* Add bucket */}
          <div style={{ flex: '0 0 380px', width: 380 }}>
            {addingBucket ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12 }}>
                <input
                  autoFocus
                  value={newBucketName}
                  onChange={e => setNewBucketName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddBucket(); if (e.key === 'Escape') setAddingBucket(false) }}
                  placeholder="Bucket name"
                  style={{ padding: '6px 10px', fontSize: 13, background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', outline: 'none' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleAddBucket} style={{ flex: 1, padding: '5px 10px', background: 'var(--accent)', color: 'var(--text-inverse)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Add</button>
                  <button onClick={() => setAddingBucket(false)} style={{ flex: 1, padding: '5px 10px', background: 'none', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingBucket(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: 12, borderRadius: 12, background: 'transparent', border: '1px dashed var(--border-default)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', transition: 'all 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <Plus size={14} /> Add Bucket
              </button>
            )}
          </div>
        </div>

        {/* Drag ghost overlay */}
        <DragOverlay>
          {activeColumn && (
            <div style={{
              width: 380, height: 80, flexShrink: 0,
              background: 'var(--bg-surface)',
              border: '1px solid var(--accent)',
              borderRadius: 12,
              opacity: 0.85,
              display: 'flex', alignItems: 'center', padding: '0 16px',
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {activeColumn.name}
              </span>
            </div>
          )}
          {activeTask && (
            <div style={{ opacity: 0.6 }}>
              <TaskCard task={activeTask} isDragOverlay />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
