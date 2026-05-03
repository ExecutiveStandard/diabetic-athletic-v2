// src/components/Nav.jsx
import Button from './Button'
import { useAppStore } from '../store/appStore'

export default function Nav() {
  const { openModal } = useAppStore()

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-da-dark">Diabetic Athletic</h1>
        </div>

        <div className="hidden md:flex gap-8 items-center">
          <a href="#home" className="text-da-dark hover:text-da-cyan transition">Home</a>
          <a href="#about" className="text-da-dark hover:text-da-cyan transition">About</a>
          <a href="#resources" className="text-da-dark hover:text-da-cyan transition">Free Resources</a>
          <a href="#blog" className="text-da-dark hover:text-da-cyan transition">Blog</a>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => openModal('newsletterOpen')}
        >
          Subscribe
        </Button>
      </div>
    </nav>
  )
}
