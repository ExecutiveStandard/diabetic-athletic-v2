// src/components/Nav.jsx
import Button from './Button'
import { useAppStore } from '../store/appStore'

export default function Nav() {
  const { openModal } = useAppStore()

  return (
    <nav className="bg-da-dark border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-black uppercase tracking-wider text-white">
            <span className="text-da-cyan">DIABETIC</span> ATHLETIC
          </h1>
        </div>

        <div className="hidden md:flex gap-10 items-center">
          <a href="#home" className="text-white/80 hover:text-da-cyan transition uppercase text-sm font-bold tracking-wider">Home</a>
          <a href="#about" className="text-white/80 hover:text-da-cyan transition uppercase text-sm font-bold tracking-wider">About</a>
          <a href="#resources" className="text-white/80 hover:text-da-cyan transition uppercase text-sm font-bold tracking-wider">Free Resources</a>
          <a href="#blog" className="text-white/80 hover:text-da-cyan transition uppercase text-sm font-bold tracking-wider">Blog</a>
        </div>

        <Button
          variant="gradient"
          size="sm"
          onClick={() => openModal('newsletterOpen')}
        >
          Subscribe
        </Button>
      </div>
    </nav>
  )
}
