// src/components/Button.jsx
export default function Button({
  children,
  variant = 'gradient',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  className = ''
}) {
  const baseClasses = 'font-bold uppercase tracking-wider rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed inline-block'

  const variants = {
    gradient: 'bg-gradient-to-r from-da-cyan to-da-gold text-da-dark hover:opacity-90 hover:shadow-lg hover:shadow-da-cyan/30',
    primary: 'bg-da-cyan text-da-dark hover:opacity-90',
    secondary: 'bg-da-gold text-da-dark hover:opacity-90',
    outline: 'border-2 border-da-cyan text-da-cyan hover:bg-da-cyan hover:text-da-dark',
    dark: 'bg-da-dark text-white border border-white/20 hover:border-da-cyan',
  }

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}
