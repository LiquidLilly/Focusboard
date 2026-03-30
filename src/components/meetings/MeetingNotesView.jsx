import { useState } from 'react'
import useStore from '../../store/useStore'
import { Button } from '../ui/Button'
import { MarkdownRenderer } from '../ui/MarkdownRenderer'
import { callClaudeStream, getApiKey } from '../../hooks/useAI'
import { generateId } from '../../utils/uuid'
import { format, parseISO } from 'date-fns'
import { FileText, Plus, Trash2 } from 'lucide-react'

const MEETING_SYSTEM = `You are an AI assistant helping a user with ADHD and anxiety process their meeting notes.

They specifically struggle with:
- Missing implicit commitments and social expectations from meetings
- Following through on action items they agreed to
- Catching things said between the lines
- Feeling overwhelmed and missing context afterward

Be proactive, specific, and direct. Name specific things — not vague categories.`

export function MeetingNotesView() {
  const { meetings, saveMeeting, deleteMeeting, projects, addItem, setSelectedItemId } = useStore()

  const [selectedMeetingId, setSelectedMeetingId] = useState(null)
  const [isNew, setIsNew] = useState(false)

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [attendees, setAttendees] = useState('')
  const [rawNotes, setRawNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [output, setOutput] = useState('')

  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId)

  function startNew() {
    setIsNew(true)
    setSelectedMeetingId(null)
    setTitle('')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setAttendees('')
    setRawNotes('')
    setOutput('')
  }

  function loadMeeting(meeting) {
    setIsNew(false)
    setSelectedMeetingId(meeting.id)
    setTitle(meeting.title)
    setDate(meeting.date)
    setAttendees(meeting.attendees)
    setRawNotes(meeting.rawNotes)
    setOutput(meeting.output || '')
  }

  async function processMeeting() {
    if (!rawNotes.trim()) return
    if (!getApiKey()) {
      setOutput('⚠ No API key set. Go to Settings to add your Claude API key.')
      return
    }
    setProcessing(true)
    setOutput('')

    const prompt = `Process these meeting notes for me. I need you to be thorough and proactive — I have ADHD and will miss things.

**Meeting:** ${title || 'Untitled Meeting'}
**Date:** ${date}
**Attendees:** ${attendees || 'Not specified'}

**Raw Notes:**
${rawNotes}

---

Please extract and structure the following sections:

## Action Items for Me
List every task where I am responsible. Be specific. Include any implied timeline if mentioned.

## Decisions Made
What was agreed upon or decided in this meeting?

## Follow-Ups I Need to Chase
Things I need to follow up on WITH OTHERS — emails to send, people to ping, approvals to get.

## Deadlines Mentioned
Any dates, timeframes, or "by X" phrases — even informal ones like "before the next sprint."

## Things I Might Have Missed ⚠
THIS IS CRITICAL. Based on reading between the lines:
- Any implicit commitments I made (agreeing to something by nodding, saying "sure" or "sounds good")
- Social expectations others may have from this meeting
- Anything said that might come back to bite me if I ignore it
- Context I'll need later that isn't obvious from the surface text
Be very specific. This section is the most important one.

## Questions I Should Ask
Things that were unclear or ambiguous that I need to clarify before acting.`

    try {
      let fullOutput = ''
      await callClaudeStream(prompt, (chunk, full) => {
        fullOutput = full
        setOutput(full)
      }, MEETING_SYSTEM, 3000)

      const meeting = {
        id: selectedMeetingId || generateId(),
        title: title || 'Untitled Meeting',
        date,
        attendees,
        rawNotes,
        output: fullOutput,
        processedAt: new Date().toISOString(),
      }
      saveMeeting(meeting)
      setSelectedMeetingId(meeting.id)
      setIsNew(false)
    } catch (err) {
      setOutput(`Error processing notes: ${err.message}`)
    } finally {
      setProcessing(false)
    }
  }

  function addToBoard(actionText) {
    if (projects.length === 0) return
    const project = projects[0]
    const bucket = project.buckets.find(b => b.name.toLowerCase().includes('next') || b.name.toLowerCase().includes('to do') || b.name.toLowerCase().includes('backlog')) || project.buckets[0]
    const itemId = addItem(project.id, bucket.id, {
      title: actionText.slice(0, 100),
      type: 'task',
      description: `From meeting: ${title || 'Untitled'} (${date})\n\n${actionText}`,
    })
    setSelectedItemId(itemId)
  }

  function extractActionItems(output) {
    const lines = output.split('\n')
    const inSection = []
    let inActionSection = false
    for (const line of lines) {
      if (line.match(/^#+\s*Action Items/i)) { inActionSection = true; continue }
      if (line.match(/^#+\s/) && inActionSection) { inActionSection = false }
      if (inActionSection && line.match(/^[-*•]\s/)) {
        inSection.push(line.replace(/^[-*•]\s*/, '').trim())
      }
    }
    return inSection
  }

  const actionItems = output ? extractActionItems(output) : []

  return (
    <div className="flex-1 flex overflow-hidden font-mono bg-[#080808]">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-[#444466] flex flex-col bg-[#080808]">
        <div className="px-3 py-2.5 border-b border-[#444466] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wide text-[#cccccc]">Meetings</span>
          <button onClick={startNew} className="text-[#cccccc] hover:text-[#00fff7]" title="New meeting">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {meetings.length === 0 && (
            <div className="text-xs text-[#cccccc] italic px-3 py-4">No meetings yet.</div>
          )}
          {meetings.map(m => (
            <div
              key={m.id}
              className={`group flex items-center justify-between px-3 py-2 cursor-pointer border-b border-[#444466] hover:bg-[#111118]
                ${selectedMeetingId === m.id ? 'bg-[#111118] border-l-2 border-l-[#00fff7]' : ''}`}
              onClick={() => loadMeeting(m)}
            >
              <div className="min-w-0">
                <div className="text-xs font-bold truncate text-[#ffffff]">{m.title}</div>
                <div className="text-xs text-[#cccccc]">{format(parseISO(m.date), 'MMM d, yyyy')}</div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); deleteMeeting(m.id); if (selectedMeetingId === m.id) { setSelectedMeetingId(null); setIsNew(false) } }}
                className="opacity-0 group-hover:opacity-100 text-[#cccccc] hover:text-[#ff3333] ml-1 shrink-0"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      {!isNew && !selectedMeetingId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileText size={32} className="text-[#444466] mx-auto mb-3" />
            <p className="text-sm text-[#cccccc]">Select a meeting or start a new one.</p>
            <button
              onClick={startNew}
              className="mt-3 text-sm font-mono border border-[#444466] px-3 py-1.5 text-[#cccccc] hover:text-[#00fff7] hover:border-[#00fff7]"
            >
              + New meeting
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Input panel */}
          <div className="w-1/2 flex flex-col border-r border-[#444466]">
            <div className="p-4 border-b border-[#444466] flex flex-col gap-2">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Meeting title…"
                className="font-mono font-bold text-base bg-transparent outline-none text-[#ffffff] placeholder-[#666688] border-b border-[#444466] focus:border-[#00fff7] pb-1"
              />
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-[#cccccc] font-bold">Date:</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="font-mono font-bold text-xs bg-transparent outline-none text-[#ffffff] border-b border-[#444466]"
                  />
                </div>
                <div className="flex items-center gap-1 flex-1">
                  <label className="text-xs text-[#cccccc] font-bold">Attendees:</label>
                  <input
                    value={attendees}
                    onChange={e => setAttendees(e.target.value)}
                    placeholder="Alice, Bob…"
                    className="font-mono font-bold text-xs bg-transparent outline-none text-[#ffffff] placeholder-[#666688] border-b border-[#444466] flex-1"
                  />
                </div>
              </div>
            </div>

            <textarea
              value={rawNotes}
              onChange={e => setRawNotes(e.target.value)}
              placeholder="Paste or type your meeting notes here…"
              className="flex-1 font-mono font-bold text-sm bg-[#080808] px-4 py-3 outline-none text-[#ffffff] placeholder-[#666688] resize-none"
            />

            <div className="px-4 py-3 border-t border-[#444466]">
              <Button variant="primary" onClick={processMeeting} disabled={processing || !rawNotes.trim()}>
                {processing ? '⏳ Processing…' : '✦ Process with Claude'}
              </Button>
              {!getApiKey() && (
                <span className="text-xs text-[#cccccc] ml-3">Add API key in Settings first.</span>
              )}
            </div>
          </div>

          {/* Output panel */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            {output ? (
              <>
                {actionItems.length > 0 && (
                  <div className="px-4 py-2 border-b border-[#444466] bg-[#00fff715]">
                    <div className="text-xs font-bold text-[#00fff7] mb-1.5 uppercase tracking-wide">Quick-add to Board:</div>
                    <div className="flex flex-col gap-1">
                      {actionItems.slice(0, 4).map((action, i) => (
                        <button
                          key={i}
                          onClick={() => addToBoard(action)}
                          className="text-xs font-mono font-bold text-left text-[#00fff7] border border-[#00fff7] bg-[#111118] px-2 py-1 hover:bg-[#00fff715] truncate flex items-center gap-1"
                        >
                          <Plus size={10} />
                          {action.slice(0, 70)}{action.length > 70 ? '…' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto px-4 py-3">
                  <MarkdownRenderer content={output} className="text-[#ffffff]" />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-[#cccccc] italic text-center px-8">
                  {processing ? 'Claude is reading your notes…' : 'Processed notes will appear here.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
