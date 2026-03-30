import { useState } from 'react'
import {
  DndContext,
  closestCorners,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import useStore from '../../store/useStore'
import { BucketColumn } from './BucketColumn'
import { ItemCard } from './ItemCard'
import { Button } from '../ui/Button'
import { Plus } from 'lucide-react'

export function BoardView() {
  const { projects, activeProjectId, addBucket, moveItem, reorderItems, reorderBuckets, getItem } = useStore()
  const project = projects.find(p => p.id === activeProjectId)
  const [activeDragId, setActiveDragId] = useState(null)
  const [addingBucket, setAddingBucket] = useState(false)
  const [newBucketName, setNewBucketName] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#cccccc] font-mono text-sm">
        No project selected. Choose one in the sidebar.
      </div>
    )
  }

  const sortedBuckets = [...project.buckets].sort((a, b) => a.order - b.order)

  function handleDragStart(event) {
    setActiveDragId(event.active.id)
  }

  function handleDragOver(event) {
    const { active, over } = event
    if (!over) return
    const activeData = active.data.current
    const overData = over.data.current
    if (activeData?.type !== 'item') return
    const fromBucketId = activeData.bucketId
    let toBucketId = null
    if (overData?.type === 'bucket') toBucketId = overData.bucketId
    else if (overData?.type === 'item') toBucketId = overData.bucketId
    if (!toBucketId || fromBucketId === toBucketId) return
    const targetBucket = project.buckets.find(b => b.id === toBucketId)
    if (!targetBucket) return
    moveItem(active.id, activeData.projectId, toBucketId, targetBucket.items.length)
  }

  function handleDragEnd(event) {
    setActiveDragId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeData = active.data.current
    const overData = over.data.current
    if (activeData?.type === 'item' && overData?.type === 'item') {
      const bucketId = overData.bucketId
      if (activeData.bucketId !== bucketId) return
      const bucket = project.buckets.find(b => b.id === bucketId)
      if (!bucket) return
      const ids = bucket.items.map(i => i.id)
      const oldIdx = ids.indexOf(active.id)
      const newIdx = ids.indexOf(over.id)
      if (oldIdx === -1 || newIdx === -1) return
      const newIds = [...ids]
      newIds.splice(oldIdx, 1)
      newIds.splice(newIdx, 0, active.id)
      reorderItems(project.id, bucketId, newIds)
    }
  }

  function handleAddBucket() {
    if (!newBucketName.trim()) return
    addBucket(project.id, newBucketName.trim())
    setNewBucketName('')
    setAddingBucket(false)
  }

  const activeItem = activeDragId ? getItem(activeDragId) : null

  return (
    <div className="flex-1 overflow-x-auto h-full bg-[#080808]">
      <div className="p-4 flex items-start gap-4 min-w-max h-full">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {sortedBuckets.map(bucket => (
            <BucketColumn key={bucket.id} bucket={bucket} project={project} />
          ))}

          <DragOverlay>
            {activeItem && (
              <div className="opacity-90 rotate-1 shadow-[0_0_20px_#00fff730]">
                <ItemCard item={activeItem} projectId={project.id} bucketId={activeItem.bucketId} />
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {/* Add bucket */}
        <div className="w-64 shrink-0">
          {addingBucket ? (
            <div className="border border-[#444466] bg-[#111118] p-2 flex flex-col gap-2">
              <input
                autoFocus
                value={newBucketName}
                onChange={e => setNewBucketName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddBucket()
                  if (e.key === 'Escape') { setAddingBucket(false); setNewBucketName('') }
                }}
                placeholder="Bucket name…"
                className="font-mono font-bold text-sm bg-transparent border-b border-[#444466] focus:border-[#00fff7] outline-none text-[#ffffff] placeholder-[#666688] py-0.5"
              />
              <div className="flex gap-1">
                <Button size="xs" variant="primary" onClick={handleAddBucket}>Add</Button>
                <Button size="xs" variant="ghost" onClick={() => { setAddingBucket(false); setNewBucketName('') }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingBucket(true)}
              className="flex items-center gap-1.5 text-sm font-mono text-[#cccccc] hover:text-[#00fff7]
                         border border-dashed border-[#444466] hover:border-[#00fff7] px-3 py-2 w-full transition-colors"
            >
              <Plus size={14} /> Add bucket
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
