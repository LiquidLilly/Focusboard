import { useState } from 'react'
import { Plus, X, Sparkles } from 'lucide-react'
import useStore from '../../store/useStore'
import { callAIStream, BASE_SYSTEM_PROMPT } from '../../hooks/useAI'

export default function OneOnOnePrep() {
  const { oneonones, addOneOnOne, updateOneOnOne, deleteOneOnOne, showToast } = useStore()

  const [selectedId, setSelectedId] = useState(oneonones[0]?.id || null)
  const [adding, setAdding]         = useState(false)
  const [newName, setNewName]       = useState('')
  const [newCadence, setNewCadence] = useState('')
  const [newBringUp, setNewBringUp] = useState('')
  const [newUnclear, setNewUnclear] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [aiStreaming, setAiStreaming]    = useState(false)

  const selected = oneonones.find(o => o.id === selectedId)

  function createOneOnOne() {
    if (!newName.trim()) return
    const id = addOneOnOne({ personName: newName.trim(), cadence: newCadence.trim() })
    setSelectedId(id)
    setAdding(false)
    setNewName('')
    setNewCadence('')
  }

  function addBringUp() {
    if (!newBringUp.trim() || !selected) return
    updateOneOnOne(selected.id, { bringUp: [...selected.bringUp, newBringUp.trim()] })
    setNewBringUp('')
  }

  function removeBringUp(i) {
    if (!selected) return
    updateOneOnOne(selected.id, { bringUp: selected.bringUp.filter((_, idx) => idx !== i) })
  }

  function addUnclear() {
    if (!newUnclear.trim() || !selected) return
    updateOneOnOne(selected.id, { unclear: [...selected.unclear, newUnclear.trim()] })
    setNewUnclear('')
  }

  function removeUnclear(i) {
    if (!selected) return
    updateOneOnOne(selected.id, { unclear: selected.unclear.filter((_, idx) => idx !== i) })
  }

  async function getAiSuggestion() {
    if (!selected) return
    setAiStreaming(true)
    setAiSuggestion('')
    const prompt = `I have a 1-on-1 meeting with ${selected.personName} coming up.\n\nThings I want to bring up:\n${selected.bringUp.map(s => `- ${s}`).join('\n') || '(none)'}\n\nThings I'm unclear on:\n${selected.unclear.map(s => `- ${s}`).join('\n') || '(none)'}\n\nHow I want to show up: ${selected.howIWantToShowUp || '(not set)'}\n\nBased on this, what are the 2 most important things to actually say in this meeting? Be specific and direct.`
    try {
      await callAIStream(prompt, (_, full) => setAiSuggestion(full), BASE_SYSTEM_PROMPT)
    } catch (e) {
      setAiSuggestion(`Error: ${e.message}`)
    } finally {
      setAiStreaming(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>1-on-1 Prep</p>
        <button
          onClick={() => setAdding(v => !v)}
          style={{ padding: '5px 12px', fontSize: 12, background: 'rgba(157,127,232,0.1)', color: 'var(--reflect-accent)', border: '1px solid rgba(157,127,232,0.25)', borderRadius: 6, cursor: 'pointer' }}
        >
          <Plus size={12} style={{ display: 'inline', marginRight: 4 }} />
          Add person
        </button>
      </div>

      {/* Add new person */}
      {adding && (
        <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createOneOnOne() }}
            placeholder="Person's name (e.g. Manager)"
            style={inputStyle}
          />
          <input
            value={newCadence}
            onChange={e => setNewCadence(e.target.value)}
            placeholder="Cadence (e.g. Every Tuesday)"
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={createOneOnOne} style={{ flex: 1, padding: '6px', background: 'var(--reflect-accent)', color: 'var(--text-inverse)', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Add</button>
            <button onClick={() => setAdding(false)} style={{ flex: 1, padding: '6px', background: 'none', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Person tabs */}
      {oneonones.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {oneonones.map(o => (
            <button
              key={o.id}
              onClick={() => setSelectedId(o.id)}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                background: selectedId === o.id ? 'rgba(157,127,232,0.15)' : 'transparent',
                color: selectedId === o.id ? 'var(--reflect-accent)' : 'var(--text-muted)',
                border: `1px solid ${selectedId === o.id ? 'rgba(157,127,232,0.35)' : 'var(--border-default)'}`,
                transition: 'all 150ms',
              }}
            >
              {o.personName}
              {o.cadence && <span style={{ fontSize: 11, marginLeft: 6, opacity: 0.6 }}>{o.cadence}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Selected person's prep card */}
      {selected && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Things to bring up */}
          <ListSection
            label="Things I want to bring up"
            items={selected.bringUp}
            newValue={newBringUp}
            setNewValue={setNewBringUp}
            onAdd={addBringUp}
            onRemove={removeBringUp}
            placeholder="Add something to raise..."
          />

          {/* Things unclear */}
          <ListSection
            label="Things I'm unclear on"
            items={selected.unclear}
            newValue={newUnclear}
            setNewValue={setNewUnclear}
            onAdd={addUnclear}
            onRemove={removeUnclear}
            placeholder="What do you need to understand better?"
          />

          {/* How I want to show up */}
          <div>
            <label style={labelStyle}>How I want to show up</label>
            <input
              value={selected.howIWantToShowUp}
              onChange={e => updateOneOnOne(selected.id, { howIWantToShowUp: e.target.value })}
              placeholder="Calm. Direct. Curious."
              style={inputStyle}
            />
          </div>

          {/* AI suggestion */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={getAiSuggestion}
              disabled={aiStreaming}
              style={{
                alignSelf: 'flex-start',
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: 'rgba(157,127,232,0.12)', color: 'var(--reflect-accent)',
                border: '1px solid rgba(157,127,232,0.25)',
                cursor: aiStreaming ? 'default' : 'pointer',
                opacity: aiStreaming ? 0.7 : 1,
              }}
            >
              <Sparkles size={14} /> {aiStreaming ? 'Thinking…' : 'What should I actually say?'}
            </button>
            {aiSuggestion !== null && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(157,127,232,0.06)', border: '1px solid rgba(157,127,232,0.18)', fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {aiSuggestion || '…'}
                {aiStreaming && <span className="streaming-cursor" />}
              </div>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={() => { deleteOneOnOne(selected.id); setSelectedId(oneonones.find(o => o.id !== selected.id)?.id || null) }}
            style={{ alignSelf: 'flex-start', fontSize: 12, color: 'var(--accent-red)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Remove {selected.personName}
          </button>
        </div>
      )}

      {!selected && oneonones.length === 0 && (
        <p style={{ fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Add a recurring 1-on-1 to start tracking what you want to say.
        </p>
      )}
    </div>
  )
}

function ListSection({ label, items, newValue, setNewValue, onAdd, onRemove, placeholder }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--reflect-accent)', paddingTop: 2, flexShrink: 0 }}>·</span>
            <span style={{ fontSize: 14, color: 'var(--text-primary)', flex: 1, lineHeight: 1.5 }}>{item}</span>
            <button onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
              <X size={12} />
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onAdd() }}
            placeholder={placeholder}
            style={{ flex: 1, padding: '7px 10px', fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', outline: 'none' }}
          />
          <button onClick={onAdd} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <Plus size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 500,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--text-muted)', marginBottom: 8,
}

const inputStyle = {
  width: '100%', padding: '8px 12px', fontSize: 13,
  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-default)',
  borderRadius: 6, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit',
}
