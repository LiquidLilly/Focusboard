export function Input({ label, type = 'text', value, onChange, placeholder, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-mono text-stone-500 uppercase tracking-wide">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="font-mono text-sm border border-warm-gray bg-parchment px-2.5 py-1.5 text-charcoal placeholder-stone-400 focus:outline-none focus:border-charcoal"
        {...props}
      />
    </div>
  )
}

export function Textarea({ label, value, onChange, placeholder, rows = 4, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-mono text-stone-500 uppercase tracking-wide">{label}</label>}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="font-mono text-sm border border-warm-gray bg-parchment px-2.5 py-1.5 text-charcoal placeholder-stone-400 focus:outline-none focus:border-charcoal resize-none"
        {...props}
      />
    </div>
  )
}

export function Select({ label, value, onChange, options, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-mono text-stone-500 uppercase tracking-wide">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className="font-mono text-sm border border-warm-gray bg-parchment px-2.5 py-1.5 text-charcoal focus:outline-none focus:border-charcoal"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
