// Lightweight markdown renderer — handles bold, bullets, and headers
export function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null

  const lines = content.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="font-mono font-semibold text-sm text-[#00fff7] mt-3 mb-1">{renderInline(line.slice(4))}</h3>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="font-mono font-semibold text-base text-[#00fff7] mt-4 mb-1 border-b border-[#1e1e3a] pb-1">{renderInline(line.slice(3))}</h2>)
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="font-mono font-bold text-lg text-[#00fff7] mt-4 mb-2">{renderInline(line.slice(2))}</h1>)
    } else if (line.match(/^[-*•]\s/)) {
      elements.push(
        <div key={i} className="flex gap-2 text-sm py-0.5">
          <span className="text-[#444466] mt-0.5 shrink-0">›</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      )
    } else if (line.match(/^\d+\.\s/)) {
      const match = line.match(/^(\d+)\.\s(.*)/)
      elements.push(
        <div key={i} className="flex gap-2 text-sm py-0.5">
          <span className="text-[#444466] shrink-0 w-4">{match[1]}.</span>
          <span>{renderInline(match[2])}</span>
        </div>
      )
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />)
    } else {
      elements.push(<p key={i} className="text-sm leading-relaxed">{renderInline(line)}</p>)
    }
    i++
  }

  return <div className={`font-mono text-[#e0e0e0] ${className}`}>{elements}</div>
}

function renderInline(text) {
  if (!text) return null
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-[#e0e0e0]">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('__') && part.endsWith('__')) {
      return <strong key={i} className="font-semibold text-[#e0e0e0]">{part.slice(2, -2)}</strong>
    }
    return part
  })
}
