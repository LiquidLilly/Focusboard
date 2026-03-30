export function Button({ children, onClick, variant = 'default', size = 'md', disabled = false, className = '', type = 'button', ...props }) {
  const base = 'font-mono border inline-flex items-center gap-1.5 cursor-pointer transition-colors duration-100 disabled:opacity-30 disabled:cursor-not-allowed'

  const variants = {
    default: 'bg-[#080808] text-[#ffffff] border-[#444466] hover:border-[#00fff7] hover:text-[#00fff7]',
    primary: 'bg-[#00fff7] text-[#080808] border-[#00fff7] hover:bg-[#00fff7cc] font-bold',
    danger:  'bg-[#080808] text-[#ff3333] border-[#ff333350] hover:bg-[#ff333315] hover:border-[#ff3333]',
    ghost:   'bg-transparent text-[#cccccc] border-transparent hover:border-[#444466] hover:text-[#ffffff]',
    amber:   'bg-[#ffd00015] text-[#ffd000] border-[#ffd00050] hover:bg-[#ffd000] hover:text-[#080808]',
  }

  const sizes = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
