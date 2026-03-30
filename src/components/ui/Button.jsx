export function Button({ children, onClick, variant = 'default', size = 'md', disabled = false, className = '', type = 'button', ...props }) {
  const base = 'font-mono border inline-flex items-center gap-1.5 cursor-pointer transition-colors duration-100 disabled:opacity-30 disabled:cursor-not-allowed'

  const variants = {
    default: 'bg-[#0d0d0d] text-[#e0e0e0] border-[#1e1e3a] hover:border-[#00fff7] hover:text-[#00fff7]',
    primary: 'bg-[#00fff7] text-[#0d0d0d] border-[#00fff7] hover:bg-[#00fff7cc] font-bold',
    danger:  'bg-[#0d0d0d] text-[#ff2020] border-[#ff202030] hover:bg-[#ff202015] hover:border-[#ff2020]',
    ghost:   'bg-transparent text-[#444466] border-transparent hover:border-[#1e1e3a] hover:text-[#e0e0e0]',
    amber:   'bg-[#ffb00010] text-[#ffb000] border-[#ffb00030] hover:bg-[#ffb000] hover:text-[#0d0d0d]',
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
