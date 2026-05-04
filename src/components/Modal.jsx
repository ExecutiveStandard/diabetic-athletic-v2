// src/components/Modal.jsx
export default function Modal({ isOpen, onClose, title, children, showCloseButton = true }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-da-dark to-da-darker border border-white/10 rounded-xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black uppercase tracking-wider text-white">{title}</h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-3xl font-light leading-none"
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
