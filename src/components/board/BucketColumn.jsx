import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import useStore from '../../store/useStore'
import { ItemCard } from './ItemCard'
import { Button } from '../ui/Button'
import { Plus, Trash2, Edit3, Check, X } from 'lucide-react'

export function BucketColumn({ bucket, project }) {
  const { addItem, updateBucket, deleteBucket } = useStore()
  const [addingItem, setAddingItem] = useState(false)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(bucket.name)

  const { setNodeRef, isOver } = useDroppable({
    id: bucket.id,
    data: { type: 'bucket', bucketId: bucket.id, projectId: project.id },
  })

  function handleAddItem() {
    if (!newItemTitle.trim()) return
    addItem(project.id, bucket.id, { title: newItemTitle.trim(), status: 'todo' })
    setNewItemTitle('')
    setAddingItem(false)
  }

  function handleSaveName() {
    if (nameValue.trim()) updateBucket(project.id, bucket.id, { name: nameValue.trim() })
    setEditingName(false)
  }

  function handleDeleteBucket() {
    if (bucket.items.length > 0) {
      if (!window.confirm(`Delete "${bucket.name}" and its ${bucket.items.length} item(s)?`)) return
    }
    deleteBucket(project.id, bucket.id)
  }

  return (
    <div className="flex flex-col w-64 shrink-0">
      {/* Bucket header */}
      <div className="flex items-center justify-between px-2 py-1.5 border border-[#444466] bg-[#111118] mb-2">
        {editingName ? (
          <input
            autoFocus
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSaveName()
              if (e.key === 'Escape') { setNameValue(bucket.name); setEditingName(false) }
            }}
            className="flex-1 font-mono text-sm bg-transparent outline-none border-b border-[#00fff7] text-[#ffffff] font-bold"
          />
        ) : (
          <span
            className="font-mono font-bold text-sm text-[#ffffff] cursor-text flex-1 uppercase tracking-wider"
            onClick={() => setEditingName(true)}
            title="Click to rename"
          >
            {bucket.name}
          </span>
        )}
        <span className="text-xs font-mono text-[#cccccc] ml-2">{bucket.items.length}</span>
        <div className="flex gap-1 ml-1 opacity-40 hover:opacity-100">
          <button onClick={() => setEditingName(true)} className="text-[#cccccc] hover:text-[#00fff7]">
            <Edit3 size={11} />
          </button>
          <button onClick={handleDeleteBucket} className="text-[#cccccc] hover:text-[#ff3333]">
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-2 min-h-24 p-1 transition-colors
          ${isOver ? 'bg-[#00fff710] ring-1 ring-[#00fff7]' : ''}`}
      >
        <SortableContext items={bucket.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {bucket.items.length === 0 && !isOver && (
            <div className="text-xs font-mono text-[#cccccc] italic text-center py-4">
              Empty. Drop or add items.
            </div>
          )}
          {bucket.items.map(item => (
            <ItemCard key={item.id} item={item} projectId={project.id} bucketId={bucket.id} />
          ))}
        </SortableContext>

        {/* Add item form */}
        {addingItem ? (
          <div className="flex flex-col gap-1.5 p-1.5 border border-[#444466] bg-[#111118]">
            <input
              autoFocus
              value={newItemTitle}
              onChange={e => setNewItemTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddItem()
                if (e.key === 'Escape') { setAddingItem(false); setNewItemTitle('') }
              }}
              placeholder="Item title…"
              className="font-mono font-bold text-sm bg-transparent border-b border-[#444466] focus:border-[#00fff7] outline-none text-[#ffffff] placeholder-[#666688] py-0.5"
            />
            <div className="flex gap-1">
              <button
                onClick={handleAddItem}
                className="text-xs font-mono text-[#080808] bg-[#00fff7] hover:bg-[#00fff7cc] px-2 py-0.5 flex items-center gap-1 font-bold"
              >
                <Check size={10} /> Add
              </button>
              <button
                onClick={() => { setAddingItem(false); setNewItemTitle('') }}
                className="text-xs font-mono text-[#cccccc] hover:text-[#ffffff] px-1"
              >
                <X size={10} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingItem(true)}
            className="flex items-center gap-1 text-xs font-mono text-[#cccccc] hover:text-[#00fff7] px-1 py-1.5 transition-colors"
          >
            <Plus size={12} /> Add item
          </button>
        )}
      </div>
    </div>
  )
}
