// src/components/Button.jsx
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  className = ''
}) {
  const baseClasses = 'font-bold rounded transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-da-cyan text-da-dark hover:opacity-90',
    secondary: 'bg-da-gold text-da-dark hover:opacity-90',
    outline: 'border-2 border-da-cyan text-da-cyan hover:bg-da-cyan hover:text-da-dark',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
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
